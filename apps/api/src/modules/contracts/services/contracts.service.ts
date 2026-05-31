import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createPaginationMeta,
  getPaginationOffset,
  normalizePagination,
  PrismaService,
} from '@app/common';
import type { PaginatedResult } from '@app/common';
import {
  ContractStatus,
  MilestoneStatus,
  Prisma,
  ProjectStatus,
  ProposalStatus,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { AuditAction } from '../../audit-log/domain/audit-action';
import { AuditResource } from '../../audit-log/domain/audit-resource';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { AuthenticatedUser } from '../../identity/application/authenticated-user';
import { IntegrationAggregateType } from '../../outbox/domain/integration-aggregate-type';
import { IntegrationEventName } from '../../outbox/domain/integration-event-name';
import { OutboxService } from '../../outbox/services/outbox.service';
import { AcceptProposalDto } from '../interfaces/http/dto/accept-proposal.dto';
import { ContractListQueryDto } from '../interfaces/http/dto/contract-list-query.dto';
import { ContractResponse } from '../interfaces/http/presenters/contract.presenter';

type ContractRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const contractSelect = {
  id: true,
  projectId: true,
  proposalId: true,
  clientId: true,
  freelancerId: true,
  status: true,
  totalAmount: true,
  currency: true,
  startedAt: true,
  endedAt: true,
  terms: true,
  project: {
    select: {
      id: true,
      title: true,
      status: true,
    },
  },
  milestones: {
    select: {
      id: true,
      title: true,
      description: true,
      amount: true,
      currency: true,
      dueAt: true,
      submittedAt: true,
      approvedAt: true,
      releasedAt: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      version: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  },
  createdAt: true,
  updatedAt: true,
  version: true,
} satisfies Prisma.ContractSelect;

const acceptableProposalStatuses: ProposalStatus[] = [
  ProposalStatus.SUBMITTED,
  ProposalStatus.SHORTLISTED,
];

@Injectable()
export class ContractsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly outboxService: OutboxService,
  ) {}

  async acceptProposal(
    clientId: string,
    proposalId: string,
    dto: AcceptProposalDto,
    context: ContractRequestContext,
  ): Promise<ContractResponse> {
    const proposal = await this.prismaService.proposal.findFirst({
      where: {
        id: proposalId,
        project: {
          clientId,
          deletedAt: null,
        },
      },
      select: {
        id: true,
        projectId: true,
        freelancerId: true,
        status: true,
        proposedAmount: true,
        currency: true,
        version: true,
        project: {
          select: {
            id: true,
            clientId: true,
            status: true,
            version: true,
          },
        },
      },
    });

    if (!proposal) {
      throw new NotFoundException('Proposal was not found');
    }

    if (proposal.status === ProposalStatus.ACCEPTED) {
      const existingContract = await this.prismaService.contract.findUnique({
        where: {
          proposalId: proposal.id,
        },
        select: contractSelect,
      });

      if (existingContract) {
        return ContractResponse.fromRecord(existingContract);
      }

      throw new ConflictException('Proposal is already accepted');
    }

    if (!acceptableProposalStatuses.includes(proposal.status)) {
      throw new BadRequestException('Proposal cannot be accepted from its current status');
    }

    if (proposal.project.status !== ProjectStatus.PUBLISHED) {
      throw new BadRequestException('Project is not open for contract creation');
    }

    this.assertMilestoneTotal(dto, proposal.proposedAmount);

    try {
      const contract = await this.prismaService.$transaction(async (transaction) => {
        const proposalUpdate = await transaction.proposal.updateMany({
          where: {
            id: proposal.id,
            version: proposal.version,
            status: {
              in: acceptableProposalStatuses,
            },
          },
          data: {
            status: ProposalStatus.ACCEPTED,
            decidedAt: new Date(),
            version: {
              increment: 1,
            },
          },
        });

        if (proposalUpdate.count !== 1) {
          throw new ConflictException('Proposal was modified by another request');
        }

        const projectUpdate = await transaction.project.updateMany({
          where: {
            id: proposal.project.id,
            version: proposal.project.version,
            status: ProjectStatus.PUBLISHED,
          },
          data: {
            status: ProjectStatus.CONTRACTED,
            closedAt: new Date(),
            version: {
              increment: 1,
            },
          },
        });

        if (projectUpdate.count !== 1) {
          throw new ConflictException('Project was modified by another request');
        }

        await transaction.proposal.updateMany({
          where: {
            projectId: proposal.projectId,
            id: {
              not: proposal.id,
            },
            status: {
              in: acceptableProposalStatuses,
            },
          },
          data: {
            status: ProposalStatus.REJECTED,
            decidedAt: new Date(),
            version: {
              increment: 1,
            },
          },
        });

        const createdContract = await transaction.contract.create({
          data: {
            project: {
              connect: {
                id: proposal.projectId,
              },
            },
            proposal: {
              connect: {
                id: proposal.id,
              },
            },
            client: {
              connect: {
                id: clientId,
              },
            },
            freelancer: {
              connect: {
                id: proposal.freelancerId,
              },
            },
            status: ContractStatus.ACTIVE,
            totalAmount: proposal.proposedAmount,
            currency: proposal.currency,
            terms: dto.terms,
            milestones: {
              create: dto.milestones.map((milestone) => ({
                title: milestone.title.trim(),
                description: this.normalizeOptionalText(milestone.description),
                amount: new Prisma.Decimal(milestone.amount),
                currency: proposal.currency,
                dueAt: milestone.dueAt ? new Date(milestone.dueAt) : null,
                status: MilestoneStatus.FUNDED,
              })),
            },
          },
          select: contractSelect,
        });

        await this.auditLogService.record(
          {
            actorId: clientId,
            action: AuditAction.PROPOSAL_ACCEPTED,
            resourceType: AuditResource.PROPOSAL,
            resourceId: proposal.id,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          transaction,
        );

        await this.auditLogService.record(
          {
            actorId: clientId,
            action: AuditAction.CONTRACT_CREATED,
            resourceType: AuditResource.CONTRACT,
            resourceId: createdContract.id,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          transaction,
        );

        await this.outboxService.record(
          {
            aggregateType: IntegrationAggregateType.CONTRACT,
            aggregateId: createdContract.id,
            aggregateVersion: createdContract.version,
            eventName: IntegrationEventName.CONTRACT_CREATED,
            payload: {
              contractId: createdContract.id,
              projectId: createdContract.projectId,
              proposalId: createdContract.proposalId,
              clientId: createdContract.clientId,
              freelancerId: createdContract.freelancerId,
              totalAmount: createdContract.totalAmount.toString(),
              currency: createdContract.currency,
              milestoneIds: createdContract.milestones.map((milestone) => milestone.id),
            },
            headers: {
              actorId: clientId,
              requestIp: context.ipAddress ?? null,
            },
          },
          transaction,
        );

        return createdContract;
      });

      return ContractResponse.fromRecord(contract);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Contract already exists for this proposal or project');
      }

      throw error;
    }
  }

  async findMyContracts(
    user: AuthenticatedUser,
    query: ContractListQueryDto,
  ): Promise<PaginatedResult<ContractResponse>> {
    const pagination = normalizePagination(query);
    const where = this.createUserContractWhere(user.id, query);
    const [contracts, total] = await this.prismaService.$transaction([
      this.prismaService.contract.findMany({
        where,
        select: contractSelect,
        orderBy: {
          startedAt: 'desc',
        },
        skip: getPaginationOffset(pagination.page, pagination.limit),
        take: pagination.limit,
      }),
      this.prismaService.contract.count({
        where,
      }),
    ]);

    return {
      items: contracts.map(ContractResponse.fromRecord),
      meta: createPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findContractForUser(
    contractId: string,
    user: AuthenticatedUser,
  ): Promise<ContractResponse> {
    const contract = await this.prismaService.contract.findFirst({
      where: {
        id: contractId,
        OR: [
          {
            clientId: user.id,
          },
          {
            freelancerId: user.id,
          },
        ],
      },
      select: contractSelect,
    });

    if (!contract) {
      throw new NotFoundException('Contract was not found');
    }

    return ContractResponse.fromRecord(contract);
  }

  private createUserContractWhere(
    userId: string,
    query: ContractListQueryDto,
  ): Prisma.ContractWhereInput {
    const where: Prisma.ContractWhereInput = {
      OR: [
        {
          clientId: userId,
        },
        {
          freelancerId: userId,
        },
      ],
    };

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private assertMilestoneTotal(dto: AcceptProposalDto, proposedAmount: Prisma.Decimal): void {
    const total = dto.milestones.reduce(
      (sum, milestone) => sum.add(new Prisma.Decimal(milestone.amount)),
      new Prisma.Decimal(0),
    );

    if (!total.equals(proposedAmount)) {
      throw new BadRequestException('Milestone amounts must match the accepted proposal amount');
    }
  }

  private normalizeOptionalText(value?: string): string | null {
    const normalized = value?.trim();

    if (!normalized) {
      return null;
    }

    return normalized;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}

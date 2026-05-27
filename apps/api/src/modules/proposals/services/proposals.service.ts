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
  PaginatedResult,
  PrismaService,
} from '@app/common';
import {
  Prisma,
  ProjectStatus,
  ProposalStatus,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { AuditAction } from '../../audit-log/domain/audit-action';
import { AuditResource } from '../../audit-log/domain/audit-resource';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { CreateProposalDto } from '../interfaces/http/dto/create-proposal.dto';
import { ProposalListQueryDto } from '../interfaces/http/dto/proposal-list-query.dto';
import { ProposalResponse } from '../interfaces/http/presenters/proposal.presenter';

type ProposalRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const proposalSelect = {
  id: true,
  projectId: true,
  freelancerId: true,
  coverLetter: true,
  proposedAmount: true,
  currency: true,
  deliveryDays: true,
  status: true,
  submittedAt: true,
  decidedAt: true,
  project: {
    select: {
      id: true,
      clientId: true,
      title: true,
      status: true,
    },
  },
  createdAt: true,
  updatedAt: true,
  version: true,
} satisfies Prisma.ProposalSelect;

const withdrawableProposalStatuses: ProposalStatus[] = [
  ProposalStatus.SUBMITTED,
  ProposalStatus.SHORTLISTED,
];

@Injectable()
export class ProposalsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async submitProposal(
    freelancerId: string,
    projectId: string,
    dto: CreateProposalDto,
    context: ProposalRequestContext,
  ): Promise<ProposalResponse> {
    const project = await this.prismaService.project.findFirst({
      where: {
        id: projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        clientId: true,
        status: true,
        currency: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project was not found');
    }

    if (project.status !== ProjectStatus.PUBLISHED) {
      throw new BadRequestException('Project is not open for proposals');
    }

    if (project.clientId === freelancerId) {
      throw new BadRequestException('Clients cannot submit proposals to their own projects');
    }

    try {
      const proposal = await this.prismaService.$transaction(async (transaction) => {
        const createdProposal = await transaction.proposal.create({
          data: {
            project: {
              connect: {
                id: project.id,
              },
            },
            freelancer: {
              connect: {
                id: freelancerId,
              },
            },
            coverLetter: dto.coverLetter.trim(),
            proposedAmount: new Prisma.Decimal(dto.proposedAmount),
            currency: dto.currency?.trim().toUpperCase() ?? project.currency,
            deliveryDays: dto.deliveryDays,
          },
          select: proposalSelect,
        });

        await this.auditLogService.record(
          {
            actorId: freelancerId,
            action: AuditAction.PROPOSAL_SUBMITTED,
            resourceType: AuditResource.PROPOSAL,
            resourceId: createdProposal.id,
            ipAddress: context.ipAddress,
            userAgent: context.userAgent,
          },
          transaction,
        );

        return createdProposal;
      });

      return ProposalResponse.fromRecord(proposal);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('A proposal has already been submitted for this project');
      }

      throw error;
    }
  }

  async findMyProposals(
    freelancerId: string,
    query: ProposalListQueryDto,
  ): Promise<PaginatedResult<ProposalResponse>> {
    const pagination = normalizePagination(query);
    const where = this.createFreelancerProposalWhere(freelancerId, query);
    const [proposals, total] = await this.prismaService.$transaction([
      this.prismaService.proposal.findMany({
        where,
        select: proposalSelect,
        orderBy: {
          submittedAt: 'desc',
        },
        skip: getPaginationOffset(pagination.page, pagination.limit),
        take: pagination.limit,
      }),
      this.prismaService.proposal.count({
        where,
      }),
    ]);

    return {
      items: proposals.map(ProposalResponse.fromRecord),
      meta: createPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findProjectProposals(
    clientId: string,
    projectId: string,
    query: ProposalListQueryDto,
  ): Promise<PaginatedResult<ProposalResponse>> {
    const project = await this.prismaService.project.findFirst({
      where: {
        id: projectId,
        clientId,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!project) {
      throw new NotFoundException('Project was not found');
    }

    const pagination = normalizePagination(query);
    const where = this.createProjectProposalWhere(project.id, query);
    const [proposals, total] = await this.prismaService.$transaction([
      this.prismaService.proposal.findMany({
        where,
        select: proposalSelect,
        orderBy: {
          submittedAt: 'desc',
        },
        skip: getPaginationOffset(pagination.page, pagination.limit),
        take: pagination.limit,
      }),
      this.prismaService.proposal.count({
        where,
      }),
    ]);

    return {
      items: proposals.map(ProposalResponse.fromRecord),
      meta: createPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async withdrawProposal(
    proposalId: string,
    freelancerId: string,
    context: ProposalRequestContext,
  ): Promise<ProposalResponse> {
    const proposal = await this.prismaService.proposal.findFirst({
      where: {
        id: proposalId,
        freelancerId,
      },
      select: proposalSelect,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal was not found');
    }

    if (proposal.status === ProposalStatus.WITHDRAWN) {
      return ProposalResponse.fromRecord(proposal);
    }

    if (!withdrawableProposalStatuses.includes(proposal.status)) {
      throw new BadRequestException('Proposal cannot be withdrawn from its current status');
    }

    const withdrawnProposal = await this.prismaService.$transaction(async (transaction) => {
      const result = await transaction.proposal.updateMany({
        where: {
          id: proposal.id,
          version: proposal.version,
        },
        data: {
          status: ProposalStatus.WITHDRAWN,
          version: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        throw new ConflictException('Proposal was modified by another request');
      }

      const updatedProposal = await transaction.proposal.findUniqueOrThrow({
        where: {
          id: proposal.id,
        },
        select: proposalSelect,
      });

      await this.auditLogService.record(
        {
          actorId: freelancerId,
          action: AuditAction.PROPOSAL_WITHDRAWN,
          resourceType: AuditResource.PROPOSAL,
          resourceId: updatedProposal.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        transaction,
      );

      return updatedProposal;
    });

    return ProposalResponse.fromRecord(withdrawnProposal);
  }

  private createFreelancerProposalWhere(
    freelancerId: string,
    query: ProposalListQueryDto,
  ): Prisma.ProposalWhereInput {
    const where: Prisma.ProposalWhereInput = {
      freelancerId,
    };

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private createProjectProposalWhere(
    projectId: string,
    query: ProposalListQueryDto,
  ): Prisma.ProposalWhereInput {
    const where: Prisma.ProposalWhereInput = {
      projectId,
    };

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}

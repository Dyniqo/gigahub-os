import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/common';
import {
  ContractStatus,
  MilestoneStatus,
  Prisma,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { AuditAction } from '../../audit-log/domain/audit-action';
import { AuditResource } from '../../audit-log/domain/audit-resource';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { AuthenticatedUser } from '../../identity/application/authenticated-user';
import { IntegrationAggregateType } from '../../outbox/domain/integration-aggregate-type';
import { IntegrationEventName } from '../../outbox/domain/integration-event-name';
import { OutboxService } from '../../outbox/services/outbox.service';
import { MilestoneResponse } from '../interfaces/http/presenters/milestone.presenter';

type MilestoneRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const milestoneSelect = {
  id: true,
  contractId: true,
  title: true,
  description: true,
  amount: true,
  currency: true,
  dueAt: true,
  submittedAt: true,
  approvedAt: true,
  releasedAt: true,
  status: true,
  contract: {
    select: {
      id: true,
      clientId: true,
      freelancerId: true,
      status: true,
      project: {
        select: {
          id: true,
          title: true,
          status: true,
        },
      },
    },
  },
  createdAt: true,
  updatedAt: true,
  version: true,
} satisfies Prisma.MilestoneSelect;

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
    private readonly outboxService: OutboxService,
  ) {}

  async findContractMilestones(
    contractId: string,
    user: AuthenticatedUser,
  ): Promise<MilestoneResponse[]> {
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
      select: {
        id: true,
      },
    });

    if (!contract) {
      throw new NotFoundException('Contract was not found');
    }

    const milestones = await this.prismaService.milestone.findMany({
      where: {
        contractId,
      },
      select: milestoneSelect,
      orderBy: {
        createdAt: 'asc',
      },
    });

    return milestones.map(MilestoneResponse.fromRecord);
  }

  async findMilestoneForUser(
    milestoneId: string,
    user: AuthenticatedUser,
  ): Promise<MilestoneResponse> {
    const milestone = await this.prismaService.milestone.findFirst({
      where: {
        id: milestoneId,
        contract: {
          OR: [
            {
              clientId: user.id,
            },
            {
              freelancerId: user.id,
            },
          ],
        },
      },
      select: milestoneSelect,
    });

    if (!milestone) {
      throw new NotFoundException('Milestone was not found');
    }

    return MilestoneResponse.fromRecord(milestone);
  }

  async submitMilestone(
    milestoneId: string,
    freelancerId: string,
    context: MilestoneRequestContext,
  ): Promise<MilestoneResponse> {
    const milestone = await this.findMilestoneForFreelancer(milestoneId, freelancerId);

    if (milestone.contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Contract is not active');
    }

    if (milestone.status === MilestoneStatus.SUBMITTED) {
      return MilestoneResponse.fromRecord(milestone);
    }

    if (milestone.status !== MilestoneStatus.FUNDED) {
      throw new BadRequestException('Milestone cannot be submitted from its current status');
    }

    const submittedMilestone = await this.prismaService.$transaction(async (transaction) => {
      const result = await transaction.milestone.updateMany({
        where: {
          id: milestone.id,
          version: milestone.version,
          status: MilestoneStatus.FUNDED,
        },
        data: {
          status: MilestoneStatus.SUBMITTED,
          submittedAt: new Date(),
          version: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        throw new ConflictException('Milestone was modified by another request');
      }

      const updatedMilestone = await transaction.milestone.findUniqueOrThrow({
        where: {
          id: milestone.id,
        },
        select: milestoneSelect,
      });

      await this.auditLogService.record(
        {
          actorId: freelancerId,
          action: AuditAction.MILESTONE_SUBMITTED,
          resourceType: AuditResource.MILESTONE,
          resourceId: updatedMilestone.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        transaction,
      );

      await this.outboxService.record(
        {
          aggregateType: IntegrationAggregateType.MILESTONE,
          aggregateId: updatedMilestone.id,
          aggregateVersion: updatedMilestone.version,
          eventName: IntegrationEventName.MILESTONE_SUBMITTED,
          payload: this.createMilestoneEventPayload(updatedMilestone),
          headers: this.createMilestoneEventHeaders(freelancerId, context),
        },
        transaction,
      );

      return updatedMilestone;
    });

    return MilestoneResponse.fromRecord(submittedMilestone);
  }

  async approveMilestone(
    milestoneId: string,
    clientId: string,
    context: MilestoneRequestContext,
  ): Promise<MilestoneResponse> {
    const milestone = await this.findMilestoneForClient(milestoneId, clientId);

    if (milestone.contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Contract is not active');
    }

    if (milestone.status === MilestoneStatus.APPROVED) {
      return MilestoneResponse.fromRecord(milestone);
    }

    if (milestone.status !== MilestoneStatus.SUBMITTED) {
      throw new BadRequestException('Milestone cannot be approved from its current status');
    }

    const approvedMilestone = await this.prismaService.$transaction(async (transaction) => {
      const result = await transaction.milestone.updateMany({
        where: {
          id: milestone.id,
          version: milestone.version,
          status: MilestoneStatus.SUBMITTED,
        },
        data: {
          status: MilestoneStatus.APPROVED,
          approvedAt: new Date(),
          version: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        throw new ConflictException('Milestone was modified by another request');
      }

      const updatedMilestone = await transaction.milestone.findUniqueOrThrow({
        where: {
          id: milestone.id,
        },
        select: milestoneSelect,
      });

      await this.auditLogService.record(
        {
          actorId: clientId,
          action: AuditAction.MILESTONE_APPROVED,
          resourceType: AuditResource.MILESTONE,
          resourceId: updatedMilestone.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        transaction,
      );

      await this.outboxService.record(
        {
          aggregateType: IntegrationAggregateType.MILESTONE,
          aggregateId: updatedMilestone.id,
          aggregateVersion: updatedMilestone.version,
          eventName: IntegrationEventName.MILESTONE_APPROVED,
          payload: this.createMilestoneEventPayload(updatedMilestone),
          headers: this.createMilestoneEventHeaders(clientId, context),
        },
        transaction,
      );

      return updatedMilestone;
    });

    return MilestoneResponse.fromRecord(approvedMilestone);
  }

  async releaseMilestone(
    milestoneId: string,
    clientId: string,
    context: MilestoneRequestContext,
  ): Promise<MilestoneResponse> {
    const milestone = await this.findMilestoneForClient(milestoneId, clientId);

    if (milestone.contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Contract is not active');
    }

    if (milestone.status === MilestoneStatus.RELEASED) {
      return MilestoneResponse.fromRecord(milestone);
    }

    if (milestone.status !== MilestoneStatus.APPROVED) {
      throw new BadRequestException('Milestone cannot be released from its current status');
    }

    const releasedMilestone = await this.prismaService.$transaction(async (transaction) => {
      const result = await transaction.milestone.updateMany({
        where: {
          id: milestone.id,
          version: milestone.version,
          status: MilestoneStatus.APPROVED,
        },
        data: {
          status: MilestoneStatus.RELEASED,
          releasedAt: new Date(),
          version: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        throw new ConflictException('Milestone was modified by another request');
      }

      const updatedMilestone = await transaction.milestone.findUniqueOrThrow({
        where: {
          id: milestone.id,
        },
        select: milestoneSelect,
      });

      const remainingMilestones = await transaction.milestone.count({
        where: {
          contractId: updatedMilestone.contractId,
          status: {
            not: MilestoneStatus.RELEASED,
          },
        },
      });

      if (remainingMilestones === 0) {
        await transaction.contract.update({
          where: {
            id: updatedMilestone.contractId,
          },
          data: {
            status: ContractStatus.COMPLETED,
            endedAt: new Date(),
            version: {
              increment: 1,
            },
          },
        });
      }

      await this.auditLogService.record(
        {
          actorId: clientId,
          action: AuditAction.MILESTONE_RELEASED,
          resourceType: AuditResource.MILESTONE,
          resourceId: updatedMilestone.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        transaction,
      );

      await this.outboxService.record(
        {
          aggregateType: IntegrationAggregateType.MILESTONE,
          aggregateId: updatedMilestone.id,
          aggregateVersion: updatedMilestone.version,
          eventName: IntegrationEventName.MILESTONE_RELEASED,
          payload: this.createMilestoneEventPayload(updatedMilestone),
          headers: this.createMilestoneEventHeaders(clientId, context),
        },
        transaction,
      );

      return updatedMilestone;
    });

    return MilestoneResponse.fromRecord(releasedMilestone);
  }

  private async findMilestoneForFreelancer(milestoneId: string, freelancerId: string) {
    const milestone = await this.prismaService.milestone.findFirst({
      where: {
        id: milestoneId,
        contract: {
          freelancerId,
        },
      },
      select: milestoneSelect,
    });

    if (!milestone) {
      throw new NotFoundException('Milestone was not found');
    }

    return milestone;
  }

  private async findMilestoneForClient(milestoneId: string, clientId: string) {
    const milestone = await this.prismaService.milestone.findFirst({
      where: {
        id: milestoneId,
        contract: {
          clientId,
        },
      },
      select: milestoneSelect,
    });

    if (!milestone) {
      throw new NotFoundException('Milestone was not found');
    }

    return milestone;
  }

  private createMilestoneEventPayload(
    milestone: Prisma.MilestoneGetPayload<{
      select: typeof milestoneSelect;
    }>,
  ): Prisma.InputJsonValue {
    return {
      milestoneId: milestone.id,
      contractId: milestone.contractId,
      projectId: milestone.contract.project.id,
      clientId: milestone.contract.clientId,
      freelancerId: milestone.contract.freelancerId,
      status: milestone.status,
      amount: milestone.amount.toString(),
      currency: milestone.currency,
    };
  }

  private createMilestoneEventHeaders(
    actorId: string,
    context: MilestoneRequestContext,
  ): Prisma.InputJsonValue {
    return {
      actorId,
      requestIp: context.ipAddress ?? null,
    };
  }
}

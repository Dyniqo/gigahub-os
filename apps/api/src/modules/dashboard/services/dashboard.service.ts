import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import {
  ContractStatus,
  MilestoneStatus,
  Prisma,
  ProjectStatus,
  ProposalStatus,
} from '@app/common/infrastructure/database/generated/prisma/client';
import {
  DashboardMoneyAmount,
  DashboardResponse,
  DashboardStatusCount,
} from '../interfaces/http/presenters/dashboard.presenter';

const pendingMilestoneStatuses = [
  MilestoneStatus.FUNDED,
  MilestoneStatus.SUBMITTED,
  MilestoneStatus.APPROVED,
];

const clientReviewMilestoneStatuses = [MilestoneStatus.SUBMITTED, MilestoneStatus.APPROVED];

const clientDecisionProposalStatuses = [ProposalStatus.SUBMITTED, ProposalStatus.SHORTLISTED];

type GroupedStatusRow<TStatus extends string> = {
  status: TStatus;
  _count: {
    _all: number;
  };
};

type GroupedMoneyRow = {
  currency: string;
  _sum: {
    amount: Prisma.Decimal | null;
  };
};

@Injectable()
export class DashboardService {
  constructor(private readonly prismaService: PrismaService) {}

  async getMyDashboard(userId: string): Promise<DashboardResponse> {
    const [
      projectStatusRows,
      proposalStatusRows,
      contractStatusRows,
      milestoneStatusRows,
      clientMilestonesWaitingForReview,
      freelancerMilestonesReadyToSubmit,
      proposalsWaitingForClientDecision,
      activeContractsAsClient,
      activeContractsAsFreelancer,
      earnedRows,
      spentRows,
      pendingEarningRows,
      committedSpendRows,
      recentActivityRows,
    ] = await Promise.all([
      this.prismaService.project.groupBy({
        by: ['status'],
        where: {
          clientId: userId,
          deletedAt: null,
        },
        _count: {
          _all: true,
        },
      }),
      this.prismaService.proposal.groupBy({
        by: ['status'],
        where: {
          freelancerId: userId,
        },
        _count: {
          _all: true,
        },
      }),
      this.prismaService.contract.groupBy({
        by: ['status'],
        where: {
          OR: [
            {
              clientId: userId,
            },
            {
              freelancerId: userId,
            },
          ],
        },
        _count: {
          _all: true,
        },
      }),
      this.prismaService.milestone.groupBy({
        by: ['status'],
        where: {
          contract: {
            OR: [
              {
                clientId: userId,
              },
              {
                freelancerId: userId,
              },
            ],
          },
        },
        _count: {
          _all: true,
        },
      }),
      this.prismaService.milestone.count({
        where: {
          status: {
            in: clientReviewMilestoneStatuses,
          },
          contract: {
            clientId: userId,
            status: ContractStatus.ACTIVE,
          },
        },
      }),
      this.prismaService.milestone.count({
        where: {
          status: MilestoneStatus.FUNDED,
          contract: {
            freelancerId: userId,
            status: ContractStatus.ACTIVE,
          },
        },
      }),
      this.prismaService.proposal.count({
        where: {
          status: {
            in: clientDecisionProposalStatuses,
          },
          project: {
            clientId: userId,
            deletedAt: null,
          },
        },
      }),
      this.prismaService.contract.count({
        where: {
          clientId: userId,
          status: ContractStatus.ACTIVE,
        },
      }),
      this.prismaService.contract.count({
        where: {
          freelancerId: userId,
          status: ContractStatus.ACTIVE,
        },
      }),
      this.prismaService.milestone.groupBy({
        by: ['currency'],
        where: {
          status: MilestoneStatus.RELEASED,
          contract: {
            freelancerId: userId,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prismaService.milestone.groupBy({
        by: ['currency'],
        where: {
          status: MilestoneStatus.RELEASED,
          contract: {
            clientId: userId,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prismaService.milestone.groupBy({
        by: ['currency'],
        where: {
          status: {
            in: pendingMilestoneStatuses,
          },
          contract: {
            freelancerId: userId,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prismaService.milestone.groupBy({
        by: ['currency'],
        where: {
          status: {
            in: pendingMilestoneStatuses,
          },
          contract: {
            clientId: userId,
          },
        },
        _sum: {
          amount: true,
        },
      }),
      this.prismaService.auditLog.findMany({
        where: {
          actorId: userId,
        },
        select: {
          id: true,
          action: true,
          resourceType: true,
          resourceId: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      }),
    ]);

    return DashboardResponse.fromRecord({
      generatedAt: new Date(),
      projectStatuses: this.mapStatusCounts(ProjectStatus, projectStatusRows),
      proposalStatuses: this.mapStatusCounts(ProposalStatus, proposalStatusRows),
      contractStatuses: this.mapStatusCounts(ContractStatus, contractStatusRows),
      milestoneStatuses: this.mapStatusCounts(MilestoneStatus, milestoneStatusRows),
      workQueue: {
        clientMilestonesWaitingForReview,
        freelancerMilestonesReadyToSubmit,
        proposalsWaitingForClientDecision,
        activeContractsAsClient,
        activeContractsAsFreelancer,
      },
      financials: {
        earned: this.mapMoneyAmounts(earnedRows),
        spent: this.mapMoneyAmounts(spentRows),
        pendingEarnings: this.mapMoneyAmounts(pendingEarningRows),
        committedSpend: this.mapMoneyAmounts(committedSpendRows),
      },
      recentActivity: recentActivityRows,
    });
  }

  private mapStatusCounts<TStatus extends string>(
    statusObject: Record<string, TStatus>,
    rows: GroupedStatusRow<TStatus>[],
  ): DashboardStatusCount[] {
    const counts = new Map(rows.map((row) => [row.status, row._count._all]));

    return Object.values(statusObject).map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }

  private mapMoneyAmounts(rows: GroupedMoneyRow[]): DashboardMoneyAmount[] {
    return rows.map((row) => ({
      currency: row.currency,
      amount: row._sum.amount ?? new Prisma.Decimal(0),
    }));
  }
}

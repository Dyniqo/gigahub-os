import { ApiProperty } from '@nestjs/swagger';
import { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';

export type DashboardStatusCount = {
  status: string;
  count: number;
};

export type DashboardMoneyAmount = {
  currency: string;
  amount: Prisma.Decimal;
};

export type DashboardRecentActivity = {
  id: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: Date;
};

export type DashboardSummaryRecord = {
  generatedAt: Date;
  projectStatuses: DashboardStatusCount[];
  proposalStatuses: DashboardStatusCount[];
  contractStatuses: DashboardStatusCount[];
  milestoneStatuses: DashboardStatusCount[];
  workQueue: {
    clientMilestonesWaitingForReview: number;
    freelancerMilestonesReadyToSubmit: number;
    proposalsWaitingForClientDecision: number;
    activeContractsAsClient: number;
    activeContractsAsFreelancer: number;
  };
  financials: {
    earned: DashboardMoneyAmount[];
    spent: DashboardMoneyAmount[];
    pendingEarnings: DashboardMoneyAmount[];
    committedSpend: DashboardMoneyAmount[];
  };
  recentActivity: DashboardRecentActivity[];
};

export class DashboardStatusCountResponse {
  @ApiProperty()
  status!: string;

  @ApiProperty()
  count!: number;
}

export class DashboardMoneyAmountResponse {
  @ApiProperty()
  currency!: string;

  @ApiProperty()
  amount!: string;
}

export class DashboardWorkQueueResponse {
  @ApiProperty()
  clientMilestonesWaitingForReview!: number;

  @ApiProperty()
  freelancerMilestonesReadyToSubmit!: number;

  @ApiProperty()
  proposalsWaitingForClientDecision!: number;

  @ApiProperty()
  activeContractsAsClient!: number;

  @ApiProperty()
  activeContractsAsFreelancer!: number;
}

export class DashboardFinancialsResponse {
  @ApiProperty({
    type: [DashboardMoneyAmountResponse],
  })
  earned!: DashboardMoneyAmountResponse[];

  @ApiProperty({
    type: [DashboardMoneyAmountResponse],
  })
  spent!: DashboardMoneyAmountResponse[];

  @ApiProperty({
    type: [DashboardMoneyAmountResponse],
  })
  pendingEarnings!: DashboardMoneyAmountResponse[];

  @ApiProperty({
    type: [DashboardMoneyAmountResponse],
  })
  committedSpend!: DashboardMoneyAmountResponse[];
}

export class DashboardRecentActivityResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  resourceType!: string;

  @ApiProperty({
    nullable: true,
  })
  resourceId!: string | null;

  @ApiProperty()
  createdAt!: string;
}

export class DashboardResponse {
  @ApiProperty()
  generatedAt!: string;

  @ApiProperty({
    type: [DashboardStatusCountResponse],
  })
  projectStatuses!: DashboardStatusCountResponse[];

  @ApiProperty({
    type: [DashboardStatusCountResponse],
  })
  proposalStatuses!: DashboardStatusCountResponse[];

  @ApiProperty({
    type: [DashboardStatusCountResponse],
  })
  contractStatuses!: DashboardStatusCountResponse[];

  @ApiProperty({
    type: [DashboardStatusCountResponse],
  })
  milestoneStatuses!: DashboardStatusCountResponse[];

  @ApiProperty({
    type: DashboardWorkQueueResponse,
  })
  workQueue!: DashboardWorkQueueResponse;

  @ApiProperty({
    type: DashboardFinancialsResponse,
  })
  financials!: DashboardFinancialsResponse;

  @ApiProperty({
    type: [DashboardRecentActivityResponse],
  })
  recentActivity!: DashboardRecentActivityResponse[];

  static fromRecord(record: DashboardSummaryRecord): DashboardResponse {
    return {
      generatedAt: record.generatedAt.toISOString(),
      projectStatuses: record.projectStatuses,
      proposalStatuses: record.proposalStatuses,
      contractStatuses: record.contractStatuses,
      milestoneStatuses: record.milestoneStatuses,
      workQueue: record.workQueue,
      financials: {
        earned: DashboardResponse.mapMoneyAmounts(record.financials.earned),
        spent: DashboardResponse.mapMoneyAmounts(record.financials.spent),
        pendingEarnings: DashboardResponse.mapMoneyAmounts(record.financials.pendingEarnings),
        committedSpend: DashboardResponse.mapMoneyAmounts(record.financials.committedSpend),
      },
      recentActivity: record.recentActivity.map((activity) => ({
        id: activity.id,
        action: activity.action,
        resourceType: activity.resourceType,
        resourceId: activity.resourceId,
        createdAt: activity.createdAt.toISOString(),
      })),
    };
  }

  private static mapMoneyAmounts(amounts: DashboardMoneyAmount[]): DashboardMoneyAmountResponse[] {
    return amounts.map((amount) => ({
      currency: amount.currency,
      amount: amount.amount.toString(),
    }));
  }
}

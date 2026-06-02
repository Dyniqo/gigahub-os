import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContractStatus,
  MilestoneStatus,
  Prisma,
  ProjectStatus,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { PaginationMeta } from '@app/common';

export type ContractRecord = {
  id: string;
  projectId: string;
  proposalId: string;
  clientId: string;
  freelancerId: string;
  status: ContractStatus;
  totalAmount: Prisma.Decimal;
  currency: string;
  startedAt: Date;
  endedAt: Date | null;
  terms: Prisma.JsonValue | null;
  project: {
    id: string;
    title: string;
    status: ProjectStatus;
  };
  milestones: {
    id: string;
    title: string;
    description: string | null;
    amount: Prisma.Decimal;
    currency: string;
    dueAt: Date | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
    releasedAt: Date | null;
    status: MilestoneStatus;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export class ContractProjectSummaryResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({
    enum: ProjectStatus,
  })
  status!: ProjectStatus;
}

export class ContractMilestoneResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  description!: string | null;

  @ApiProperty()
  amount!: string;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  dueAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  submittedAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  approvedAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  releasedAt!: string | null;

  @ApiProperty({
    enum: MilestoneStatus,
  })
  status!: MilestoneStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  version!: number;
}

export class ContractResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  projectId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  proposalId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  clientId!: string;

  @ApiProperty({
    format: 'uuid',
  })
  freelancerId!: string;

  @ApiProperty({
    enum: ContractStatus,
  })
  status!: ContractStatus;

  @ApiProperty()
  totalAmount!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  startedAt!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  endedAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Object,
  })
  terms!: Prisma.JsonValue | null;

  @ApiProperty({
    type: ContractProjectSummaryResponse,
  })
  project!: ContractProjectSummaryResponse;

  @ApiProperty({
    type: [ContractMilestoneResponse],
  })
  milestones!: ContractMilestoneResponse[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  version!: number;

  static fromRecord(contract: ContractRecord): ContractResponse {
    return {
      id: contract.id,
      projectId: contract.projectId,
      proposalId: contract.proposalId,
      clientId: contract.clientId,
      freelancerId: contract.freelancerId,
      status: contract.status,
      totalAmount: contract.totalAmount.toString(),
      currency: contract.currency,
      startedAt: contract.startedAt.toISOString(),
      endedAt: contract.endedAt?.toISOString() ?? null,
      terms: contract.terms,
      project: {
        id: contract.project.id,
        title: contract.project.title,
        status: contract.project.status,
      },
      milestones: contract.milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        description: milestone.description,
        amount: milestone.amount.toString(),
        currency: milestone.currency,
        dueAt: milestone.dueAt?.toISOString() ?? null,
        submittedAt: milestone.submittedAt?.toISOString() ?? null,
        approvedAt: milestone.approvedAt?.toISOString() ?? null,
        releasedAt: milestone.releasedAt?.toISOString() ?? null,
        status: milestone.status,
        createdAt: milestone.createdAt.toISOString(),
        updatedAt: milestone.updatedAt.toISOString(),
        version: milestone.version,
      })),
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      version: contract.version,
    };
  }
}

export class ContractPaginationMetaResponse {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty()
  hasNextPage!: boolean;

  @ApiProperty()
  hasPreviousPage!: boolean;

  static fromMeta(meta: PaginationMeta): ContractPaginationMetaResponse {
    return meta;
  }
}

export class ContractListResponse {
  @ApiProperty({
    type: [ContractResponse],
  })
  items!: ContractResponse[];

  @ApiProperty({
    type: ContractPaginationMetaResponse,
  })
  meta!: ContractPaginationMetaResponse;
}

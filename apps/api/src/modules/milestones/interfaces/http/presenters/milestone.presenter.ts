import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContractStatus,
  MilestoneStatus,
  Prisma,
  ProjectStatus,
} from '@app/common/infrastructure/database/generated/prisma/client';

export type MilestoneRecord = {
  id: string;
  contractId: string;
  title: string;
  description: string | null;
  amount: Prisma.Decimal;
  currency: string;
  dueAt: Date | null;
  submittedAt: Date | null;
  approvedAt: Date | null;
  releasedAt: Date | null;
  status: MilestoneStatus;
  contract: {
    id: string;
    clientId: string;
    freelancerId: string;
    status: ContractStatus;
    project: {
      id: string;
      title: string;
      status: ProjectStatus;
    };
  };
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export class MilestoneProjectSummaryResponse {
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

export class MilestoneContractSummaryResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

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

  @ApiProperty({
    type: MilestoneProjectSummaryResponse,
  })
  project!: MilestoneProjectSummaryResponse;
}

export class MilestoneResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  contractId!: string;

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

  @ApiProperty({
    type: MilestoneContractSummaryResponse,
  })
  contract!: MilestoneContractSummaryResponse;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  version!: number;

  static fromRecord(milestone: MilestoneRecord): MilestoneResponse {
    return {
      id: milestone.id,
      contractId: milestone.contractId,
      title: milestone.title,
      description: milestone.description,
      amount: milestone.amount.toString(),
      currency: milestone.currency,
      dueAt: milestone.dueAt?.toISOString() ?? null,
      submittedAt: milestone.submittedAt?.toISOString() ?? null,
      approvedAt: milestone.approvedAt?.toISOString() ?? null,
      releasedAt: milestone.releasedAt?.toISOString() ?? null,
      status: milestone.status,
      contract: {
        id: milestone.contract.id,
        clientId: milestone.contract.clientId,
        freelancerId: milestone.contract.freelancerId,
        status: milestone.contract.status,
        project: {
          id: milestone.contract.project.id,
          title: milestone.contract.project.title,
          status: milestone.contract.project.status,
        },
      },
      createdAt: milestone.createdAt.toISOString(),
      updatedAt: milestone.updatedAt.toISOString(),
      version: milestone.version,
    };
  }
}

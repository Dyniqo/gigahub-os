import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Prisma,
  ProjectStatus,
  ProposalStatus,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { PaginationMeta } from '@app/common';

export type ProposalRecord = {
  id: string;
  projectId: string;
  freelancerId: string;
  coverLetter: string;
  proposedAmount: Prisma.Decimal;
  currency: string;
  deliveryDays: number;
  status: ProposalStatus;
  submittedAt: Date;
  decidedAt: Date | null;
  project: {
    id: string;
    clientId: string;
    title: string;
    status: ProjectStatus;
  };
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export class ProposalProjectSummaryResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  clientId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({
    enum: ProjectStatus,
  })
  status!: ProjectStatus;
}

export class ProposalResponse {
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
  freelancerId!: string;

  @ApiProperty()
  coverLetter!: string;

  @ApiProperty()
  proposedAmount!: string;

  @ApiProperty()
  currency!: string;

  @ApiProperty()
  deliveryDays!: number;

  @ApiProperty({
    enum: ProposalStatus,
  })
  status!: ProposalStatus;

  @ApiProperty()
  submittedAt!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  decidedAt!: string | null;

  @ApiProperty({
    type: ProposalProjectSummaryResponse,
  })
  project!: ProposalProjectSummaryResponse;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  version!: number;

  static fromRecord(proposal: ProposalRecord): ProposalResponse {
    return {
      id: proposal.id,
      projectId: proposal.projectId,
      freelancerId: proposal.freelancerId,
      coverLetter: proposal.coverLetter,
      proposedAmount: proposal.proposedAmount.toString(),
      currency: proposal.currency,
      deliveryDays: proposal.deliveryDays,
      status: proposal.status,
      submittedAt: proposal.submittedAt.toISOString(),
      decidedAt: proposal.decidedAt?.toISOString() ?? null,
      project: {
        id: proposal.project.id,
        clientId: proposal.project.clientId,
        title: proposal.project.title,
        status: proposal.project.status,
      },
      createdAt: proposal.createdAt.toISOString(),
      updatedAt: proposal.updatedAt.toISOString(),
      version: proposal.version,
    };
  }
}

export class ProposalPaginationMetaResponse {
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

  static fromMeta(meta: PaginationMeta): ProposalPaginationMetaResponse {
    return meta;
  }
}

export class ProposalListResponse {
  @ApiProperty({
    type: [ProposalResponse],
  })
  items!: ProposalResponse[];

  @ApiProperty({
    type: ProposalPaginationMetaResponse,
  })
  meta!: ProposalPaginationMetaResponse;
}

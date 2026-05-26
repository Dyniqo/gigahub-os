import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, ProjectStatus } from '@app/common/infrastructure/database/generated/prisma/client';
import { PaginationMeta } from '@app/common';

export type ProjectRecord = {
  id: string;
  clientId: string;
  title: string;
  description: string;
  status: ProjectStatus;
  budgetMin: Prisma.Decimal | null;
  budgetMax: Prisma.Decimal | null;
  currency: string;
  publishedAt: Date | null;
  closedAt: Date | null;
  skills: {
    name: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

export class ProjectResponse {
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

  @ApiProperty()
  description!: string;

  @ApiProperty({
    enum: ProjectStatus,
  })
  status!: ProjectStatus;

  @ApiPropertyOptional({
    nullable: true,
  })
  budgetMin!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  budgetMax!: string | null;

  @ApiProperty()
  currency!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  publishedAt!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  closedAt!: string | null;

  @ApiProperty({
    type: [String],
  })
  skills!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiProperty()
  version!: number;

  static fromRecord(project: ProjectRecord): ProjectResponse {
    return {
      id: project.id,
      clientId: project.clientId,
      title: project.title,
      description: project.description,
      status: project.status,
      budgetMin: project.budgetMin?.toString() ?? null,
      budgetMax: project.budgetMax?.toString() ?? null,
      currency: project.currency,
      publishedAt: project.publishedAt?.toISOString() ?? null,
      closedAt: project.closedAt?.toISOString() ?? null,
      skills: project.skills.map((skill) => skill.name),
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      version: project.version,
    };
  }
}

export class PaginationMetaResponse {
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

  static fromMeta(meta: PaginationMeta): PaginationMetaResponse {
    return meta;
  }
}

export class ProjectListResponse {
  @ApiProperty({
    type: [ProjectResponse],
  })
  items!: ProjectResponse[];

  @ApiProperty({
    type: PaginationMetaResponse,
  })
  meta!: PaginationMetaResponse;
}

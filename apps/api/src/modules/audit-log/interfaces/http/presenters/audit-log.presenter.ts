import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PaginationMeta } from '@app/common';
import type { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';

export type AuditLogRecord = {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

export class AuditLogResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
  })
  actorId!: string | null;

  @ApiProperty()
  action!: string;

  @ApiProperty()
  resourceType!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    nullable: true,
  })
  resourceId!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  ipAddress!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  userAgent!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    type: Object,
  })
  metadata!: Prisma.JsonValue | null;

  @ApiProperty()
  createdAt!: string;

  static fromRecord(auditLog: AuditLogRecord): AuditLogResponse {
    return {
      id: auditLog.id,
      actorId: auditLog.actorId,
      action: auditLog.action,
      resourceType: auditLog.resourceType,
      resourceId: auditLog.resourceId,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt.toISOString(),
    };
  }
}

export class AuditLogPaginationMetaResponse {
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

  static fromMeta(meta: PaginationMeta): AuditLogPaginationMetaResponse {
    return meta;
  }
}

export class AuditLogListResponse {
  @ApiProperty({
    type: [AuditLogResponse],
  })
  items!: AuditLogResponse[];

  @ApiProperty({
    type: AuditLogPaginationMetaResponse,
  })
  meta!: AuditLogPaginationMetaResponse;
}

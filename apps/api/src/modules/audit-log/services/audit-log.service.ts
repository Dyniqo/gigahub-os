import { Injectable } from '@nestjs/common';
import {
  createPaginationMeta,
  getPaginationOffset,
  normalizePagination,
  PrismaService,
} from '@app/common';
import type { PaginatedResult } from '@app/common';
import type { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';
import { AuditLogListQueryDto } from '../interfaces/http/dto/audit-log-list-query.dto';
import { AuditLogResponse } from '../interfaces/http/presenters/audit-log.presenter';

export type RecordAuditLogInput = {
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
};

type AuditLogClient = {
  auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<unknown>;
  };
};

const auditLogSelect = {
  id: true,
  actorId: true,
  action: true,
  resourceType: true,
  resourceId: true,
  ipAddress: true,
  userAgent: true,
  metadata: true,
  createdAt: true,
} satisfies Prisma.AuditLogSelect;

@Injectable()
export class AuditLogService {
  constructor(private readonly prismaService: PrismaService) {}

  async record(
    input: RecordAuditLogInput,
    client: AuditLogClient = this.prismaService,
  ): Promise<void> {
    await client.auditLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: input.metadata,
      },
    });
  }

  async findActorLogs(
    actorId: string,
    query: AuditLogListQueryDto,
  ): Promise<PaginatedResult<AuditLogResponse>> {
    const pagination = normalizePagination(query);
    const where = this.createActorAuditLogWhere(actorId, query);
    const [auditLogs, total] = await this.prismaService.$transaction([
      this.prismaService.auditLog.findMany({
        where,
        select: auditLogSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip: getPaginationOffset(pagination.page, pagination.limit),
        take: pagination.limit,
      }),
      this.prismaService.auditLog.count({
        where,
      }),
    ]);

    return {
      items: auditLogs.map(AuditLogResponse.fromRecord),
      meta: createPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  private createActorAuditLogWhere(
    actorId: string,
    query: AuditLogListQueryDto,
  ): Prisma.AuditLogWhereInput {
    const where: Prisma.AuditLogWhereInput = {
      actorId,
    };

    const action = query.action?.trim();
    const resourceType = query.resourceType?.trim();
    const resourceId = query.resourceId?.trim();

    if (action) {
      where.action = action;
    }

    if (resourceType) {
      where.resourceType = resourceType;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    return where;
  }
}

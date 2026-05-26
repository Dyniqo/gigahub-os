import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';

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
}

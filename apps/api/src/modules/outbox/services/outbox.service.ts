import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';

export type RecordOutboxEventInput = {
  aggregateType: string;
  aggregateId: string;
  aggregateVersion?: number;
  eventName: string;
  eventVersion?: number;
  payload: Prisma.InputJsonValue;
  headers?: Prisma.InputJsonValue;
};

type OutboxEventClient = {
  outboxEvent: {
    create(args: Prisma.OutboxEventCreateArgs): Promise<unknown>;
  };
};

@Injectable()
export class OutboxService {
  constructor(private readonly prismaService: PrismaService) {}

  async record(
    input: RecordOutboxEventInput,
    client: OutboxEventClient = this.prismaService,
  ): Promise<void> {
    await client.outboxEvent.create({
      data: {
        aggregateType: input.aggregateType,
        aggregateId: input.aggregateId,
        aggregateVersion: input.aggregateVersion,
        eventName: input.eventName,
        eventVersion: input.eventVersion ?? 1,
        payload: input.payload,
        headers: input.headers,
      },
    });
  }
}

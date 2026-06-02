import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';

export type PublishOutboxEventInput = {
  id: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number | null;
  eventName: string;
  eventVersion: number;
  payload: Prisma.JsonValue;
  headers: Prisma.JsonValue | null;
  createdAt: Date;
};

@Injectable()
export class OutboxEventPublisher {
  private readonly logger = new Logger(OutboxEventPublisher.name);

  async publish(event: PublishOutboxEventInput): Promise<void> {
    this.logger.log(
      JSON.stringify({
        type: 'integration_event_published',
        eventId: event.id,
        eventName: event.eventName,
        eventVersion: event.eventVersion,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        aggregateVersion: event.aggregateVersion,
        occurredAt: event.createdAt.toISOString(),
      }),
    );
  }
}

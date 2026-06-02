import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { PrismaService } from '@app/common';
import type { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';
import { OutboxEventPublisher } from './outbox-event-publisher';

const outboxRelaySelect = {
  id: true,
  aggregateType: true,
  aggregateId: true,
  aggregateVersion: true,
  eventName: true,
  eventVersion: true,
  payload: true,
  headers: true,
  attempts: true,
  createdAt: true,
} satisfies Prisma.OutboxEventSelect;

type OutboxRelayEvent = Prisma.OutboxEventGetPayload<{
  select: typeof outboxRelaySelect;
}>;

@Injectable()
export class OutboxRelayService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxRelayService.name);
  private readonly intervalMs = 5000;
  private readonly batchSize = 25;
  private timer?: ReturnType<typeof setInterval>;
  private isDraining = false;

  constructor(
    private readonly prismaService: PrismaService,
    private readonly outboxEventPublisher: OutboxEventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    this.logger.log(
      JSON.stringify({
        type: 'outbox_relay_started',
        intervalMs: this.intervalMs,
        batchSize: this.batchSize,
      }),
    );

    void this.drain();

    this.timer = setInterval(() => {
      void this.drain();
    }, this.intervalMs);
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private async drain(): Promise<void> {
    if (this.isDraining) {
      return;
    }

    this.isDraining = true;

    try {
      const events = await this.prismaService.outboxEvent.findMany({
        where: {
          attempts: 0,
        },
        select: outboxRelaySelect,
        orderBy: {
          createdAt: 'asc',
        },
        take: this.batchSize,
      });

      if (events.length === 0) {
        return;
      }

      this.logger.log(
        JSON.stringify({
          type: 'outbox_relay_batch_loaded',
          size: events.length,
        }),
      );

      for (const event of events) {
        await this.processEvent(event);
      }
    } finally {
      this.isDraining = false;
    }
  }

  private async processEvent(event: OutboxRelayEvent): Promise<void> {
    try {
      await this.outboxEventPublisher.publish({
        id: event.id,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        aggregateVersion: event.aggregateVersion,
        eventName: event.eventName,
        eventVersion: event.eventVersion,
        payload: event.payload,
        headers: event.headers,
        createdAt: event.createdAt,
      });

      const result = await this.prismaService.outboxEvent.updateMany({
        where: {
          id: event.id,
          attempts: event.attempts,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        this.logger.warn(
          JSON.stringify({
            type: 'outbox_relay_event_skipped',
            eventId: event.id,
            eventName: event.eventName,
          }),
        );

        return;
      }

      this.logger.log(
        JSON.stringify({
          type: 'outbox_relay_event_processed',
          eventId: event.id,
          eventName: event.eventName,
          attempts: event.attempts + 1,
        }),
      );
    } catch (error) {
      this.logFailedEvent(event, error);
    }
  }

  private logFailedEvent(event: OutboxRelayEvent, error: unknown): void {
    this.logger.error(
      JSON.stringify({
        type: 'outbox_relay_event_failed',
        eventId: event.id,
        eventName: event.eventName,
        attempts: event.attempts,
        error: this.normalizeErrorMessage(error),
      }),
    );
  }

  private normalizeErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message.slice(0, 2000);
    }

    return String(error).slice(0, 2000);
  }
}

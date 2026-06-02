import { Module } from '@nestjs/common';
import { OutboxEventPublisher } from './outbox-event-publisher';
import { OutboxRelayService } from './outbox-relay.service';

@Module({
  providers: [OutboxEventPublisher, OutboxRelayService],
})
export class OutboxRelayModule {}

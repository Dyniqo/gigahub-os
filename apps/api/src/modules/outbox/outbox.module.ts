import { Module } from '@nestjs/common';
import { OutboxService } from './services/outbox.service';

@Module({
  providers: [OutboxService],
  exports: [OutboxService],
})
export class OutboxModule {}

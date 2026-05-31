import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OutboxModule } from '../outbox/outbox.module';
import { MilestonesController } from './interfaces/http/milestones.controller';
import { MilestonesService } from './services/milestones.service';

@Module({
  imports: [AuditLogModule, OutboxModule],
  controllers: [MilestonesController],
  providers: [MilestonesService],
  exports: [MilestonesService],
})
export class MilestonesModule {}

import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OutboxModule } from '../outbox/outbox.module';
import { ContractsController } from './interfaces/http/contracts.controller';
import { ContractsService } from './services/contracts.service';

@Module({
  imports: [AuditLogModule, OutboxModule],
  controllers: [ContractsController],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsModule {}

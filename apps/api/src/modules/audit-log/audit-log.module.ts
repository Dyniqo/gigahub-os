import { Module } from '@nestjs/common';
import { AuditLogService } from './services/audit-log.service';

@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}

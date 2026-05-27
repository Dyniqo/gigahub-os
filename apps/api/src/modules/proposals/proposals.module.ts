import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ProposalsController } from './interfaces/http/proposals.controller';
import { ProposalsService } from './services/proposals.service';

@Module({
  imports: [AuditLogModule],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService],
})
export class ProposalsModule {}

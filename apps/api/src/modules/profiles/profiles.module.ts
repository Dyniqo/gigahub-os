import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ProfilesController } from './interfaces/http/profiles.controller';
import { ProfilesService } from './services/profiles.service';

@Module({
  imports: [AuditLogModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}

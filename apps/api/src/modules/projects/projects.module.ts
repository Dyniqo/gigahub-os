import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ProjectsController } from './interfaces/http/projects.controller';
import { ProjectsService } from './services/projects.service';

@Module({
  imports: [AuditLogModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}

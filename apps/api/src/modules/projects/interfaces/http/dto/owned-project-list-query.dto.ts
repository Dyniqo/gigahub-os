import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectStatus } from '@app/common/infrastructure/database/generated/prisma/client';
import { ProjectListQueryDto } from './project-list-query.dto';

export class OwnedProjectListQueryDto extends ProjectListQueryDto {
  @ApiPropertyOptional({
    enum: ProjectStatus,
  })
  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;
}

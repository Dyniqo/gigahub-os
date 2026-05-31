import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../../identity/application/authenticated-user';
import { CurrentUser } from '../../../identity/interfaces/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../identity/interfaces/http/guards/jwt-auth.guard';
import { AuditLogService } from '../../services/audit-log.service';
import { AuditLogListResponse } from './presenters/audit-log.presenter';

@ApiTags('Audit Logs')
@ApiBearerAuth('jwt')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get('me')
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
  })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    example: 'PROJECT_CREATED',
  })
  @ApiQuery({
    name: 'resourceType',
    required: false,
    type: String,
    example: 'PROJECT',
  })
  @ApiQuery({
    name: 'resourceId',
    required: false,
    type: String,
    format: 'uuid',
  })
  @ApiOkResponse({
    type: AuditLogListResponse,
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('action') action?: string,
    @Query('resourceType') resourceType?: string,
    @Query('resourceId') resourceId?: string,
  ): Promise<AuditLogListResponse> {
    return this.auditLogService.findActorLogs(user.id, {
      page,
      limit,
      action,
      resourceType,
      resourceId,
    });
  }
}

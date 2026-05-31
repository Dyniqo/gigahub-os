import { Controller, Get, Param, ParseUUIDPipe, Patch, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { UserRole } from '@app/common/infrastructure/database/generated/prisma/client';
import { AuthenticatedUser } from '../../../identity/application/authenticated-user';
import { CurrentUser } from '../../../identity/interfaces/http/decorators/current-user.decorator';
import { Roles } from '../../../identity/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../identity/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interfaces/http/guards/roles.guard';
import { MilestonesService } from '../../services/milestones.service';
import { MilestoneResponse } from './presenters/milestone.presenter';

@ApiTags('Milestones')
@ApiBearerAuth('jwt')
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  @Get('contracts/:contractId/milestones')
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  @ApiParam({
    name: 'contractId',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: [MilestoneResponse],
  })
  @ApiNotFoundResponse({
    description: 'Contract was not found.',
  })
  findForContract(
    @CurrentUser() user: AuthenticatedUser,
    @Param('contractId', ParseUUIDPipe) contractId: string,
  ): Promise<MilestoneResponse[]> {
    return this.milestonesService.findContractMilestones(contractId, user);
  }

  @Get('milestones/:id')
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: MilestoneResponse,
  })
  @ApiNotFoundResponse({
    description: 'Milestone was not found.',
  })
  findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MilestoneResponse> {
    return this.milestonesService.findMilestoneForUser(id, user);
  }

  @Patch('milestones/:id/submit')
  @Roles(UserRole.FREELANCER)
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: MilestoneResponse,
  })
  @ApiNotFoundResponse({
    description: 'Milestone was not found.',
  })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<MilestoneResponse> {
    return this.milestonesService.submitMilestone(id, user.id, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }

  @Patch('milestones/:id/approve')
  @Roles(UserRole.CLIENT)
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: MilestoneResponse,
  })
  @ApiNotFoundResponse({
    description: 'Milestone was not found.',
  })
  approve(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<MilestoneResponse> {
    return this.milestonesService.approveMilestone(id, user.id, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }

  @Patch('milestones/:id/release')
  @Roles(UserRole.CLIENT)
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: MilestoneResponse,
  })
  @ApiNotFoundResponse({
    description: 'Milestone was not found.',
  })
  release(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<MilestoneResponse> {
    return this.milestonesService.releaseMilestone(id, user.id, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }
}

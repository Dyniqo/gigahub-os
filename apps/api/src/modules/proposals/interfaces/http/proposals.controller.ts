import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
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
import { CreateProposalDto } from './dto/create-proposal.dto';
import { ProposalListQueryDto } from './dto/proposal-list-query.dto';
import { ProposalListResponse, ProposalResponse } from './presenters/proposal.presenter';
import { ProposalsService } from '../../services/proposals.service';

@ApiTags('Proposals')
@Controller()
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Post('projects/:projectId/proposals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiBearerAuth('jwt')
  @ApiParam({
    name: 'projectId',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    type: ProposalResponse,
  })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateProposalDto,
    @Req() request: Request,
  ): Promise<ProposalResponse> {
    return this.proposalsService.submitProposal(user.id, projectId, dto, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }

  @Get('proposals/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiBearerAuth('jwt')
  @ApiOkResponse({
    type: ProposalListResponse,
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProposalListQueryDto,
  ): Promise<ProposalListResponse> {
    return this.proposalsService.findMyProposals(user.id, query);
  }

  @Get('projects/:projectId/proposals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('jwt')
  @ApiParam({
    name: 'projectId',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: ProposalListResponse,
  })
  @ApiNotFoundResponse({
    description: 'Project was not found.',
  })
  findForProject(
    @CurrentUser() user: AuthenticatedUser,
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() query: ProposalListQueryDto,
  ): Promise<ProposalListResponse> {
    return this.proposalsService.findProjectProposals(user.id, projectId, query);
  }

  @Patch('proposals/:id/withdraw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.FREELANCER)
  @ApiBearerAuth('jwt')
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: ProposalResponse,
  })
  @ApiNotFoundResponse({
    description: 'Proposal was not found.',
  })
  withdraw(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<ProposalResponse> {
    return this.proposalsService.withdrawProposal(id, user.id, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }
}

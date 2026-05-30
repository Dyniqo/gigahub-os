import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ProposalStatus,
  UserRole,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { OptionalEnumPipe } from '@app/common';
import { AuthenticatedUser } from '../../../identity/application/authenticated-user';
import { CurrentUser } from '../../../identity/interfaces/http/decorators/current-user.decorator';
import { Roles } from '../../../identity/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../identity/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interfaces/http/guards/roles.guard';
import { CreateProposalDto } from './dto/create-proposal.dto';
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
    name: 'status',
    required: false,
    enum: ProposalStatus,
  })
  @ApiOkResponse({
    type: ProposalListResponse,
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status', new OptionalEnumPipe(ProposalStatus)) status?: ProposalStatus,
  ): Promise<ProposalListResponse> {
    return this.proposalsService.findMyProposals(user.id, {
      page,
      limit,
      status,
    });
  }

  @Get('projects/:projectId/proposals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('jwt')
  @ApiParam({
    name: 'projectId',
    format: 'uuid',
  })
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
    name: 'status',
    required: false,
    enum: ProposalStatus,
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
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status', new OptionalEnumPipe(ProposalStatus)) status?: ProposalStatus,
  ): Promise<ProposalListResponse> {
    return this.proposalsService.findProjectProposals(user.id, projectId, {
      page,
      limit,
      status,
    });
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

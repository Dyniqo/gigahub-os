import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { ContractsService } from '../../services/contracts.service';
import { AcceptProposalDto } from './dto/accept-proposal.dto';
import { ContractListQueryDto } from './dto/contract-list-query.dto';
import { ContractListResponse, ContractResponse } from './presenters/contract.presenter';

@ApiTags('Contracts')
@Controller()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('proposals/:proposalId/accept')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('jwt')
  @ApiParam({
    name: 'proposalId',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    type: ContractResponse,
  })
  @ApiNotFoundResponse({
    description: 'Proposal was not found.',
  })
  acceptProposal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('proposalId', ParseUUIDPipe) proposalId: string,
    @Body() dto: AcceptProposalDto,
    @Req() request: Request,
  ): Promise<ContractResponse> {
    return this.contractsService.acceptProposal(user.id, proposalId, dto, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }

  @Get('contracts/me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  @ApiBearerAuth('jwt')
  @ApiOkResponse({
    type: ContractListResponse,
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ContractListQueryDto,
  ): Promise<ContractListResponse> {
    return this.contractsService.findMyContracts(user, query);
  }

  @Get('contracts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  @ApiBearerAuth('jwt')
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: ContractResponse,
  })
  @ApiNotFoundResponse({
    description: 'Contract was not found.',
  })
  findById(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ContractResponse> {
    return this.contractsService.findContractForUser(id, user);
  }
}

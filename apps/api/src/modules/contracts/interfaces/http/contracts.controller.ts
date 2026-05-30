import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import {
  ContractStatus,
  UserRole,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { OptionalEnumPipe } from '@app/common';
import { AuthenticatedUser } from '../../../identity/application/authenticated-user';
import { CurrentUser } from '../../../identity/interfaces/http/decorators/current-user.decorator';
import { Roles } from '../../../identity/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../identity/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interfaces/http/guards/roles.guard';
import { ContractsService } from '../../services/contracts.service';
import { AcceptProposalDto } from './dto/accept-proposal.dto';
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
    enum: ContractStatus,
  })
  @ApiOkResponse({
    type: ContractListResponse,
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status', new OptionalEnumPipe(ContractStatus)) status?: ContractStatus,
  ): Promise<ContractListResponse> {
    return this.contractsService.findMyContracts(user, {
      page,
      limit,
      status,
    });
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

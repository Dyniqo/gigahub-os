import { Body, Controller, Get, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
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
import { ProfilesService } from '../../services/profiles.service';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { ProfileResponse } from './presenters/profile.presenter';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('jwt')
  @ApiOkResponse({
    type: ProfileResponse,
  })
  @ApiNotFoundResponse({
    description: 'Profile was not found.',
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<ProfileResponse> {
    return this.profilesService.findCurrentUserProfile(user.id);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT, UserRole.FREELANCER)
  @ApiBearerAuth('jwt')
  @ApiOkResponse({
    type: ProfileResponse,
  })
  upsertMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertProfileDto,
    @Req() request: Request,
  ): Promise<ProfileResponse> {
    return this.profilesService.upsertCurrentUserProfile(user.id, dto, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: ProfileResponse,
  })
  @ApiNotFoundResponse({
    description: 'Profile was not found.',
  })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<ProfileResponse> {
    return this.profilesService.findProfile(id);
  }
}

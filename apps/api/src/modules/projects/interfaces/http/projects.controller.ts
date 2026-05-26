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
import { ProjectsService } from '../../services/projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { OwnedProjectListQueryDto } from './dto/owned-project-list-query.dto';
import { ProjectListQueryDto } from './dto/project-list-query.dto';
import { ProjectListResponse, ProjectResponse } from './presenters/project.presenter';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('jwt')
  @ApiCreatedResponse({
    type: ProjectResponse,
  })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectDto,
    @Req() request: Request,
  ): Promise<ProjectResponse> {
    return this.projectsService.createProject(user.id, dto, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }

  @Get()
  @ApiOkResponse({
    type: ProjectListResponse,
  })
  findPublished(@Query() query: ProjectListQueryDto): Promise<ProjectListResponse> {
    return this.projectsService.findPublishedProjects(query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('jwt')
  @ApiOkResponse({
    type: ProjectListResponse,
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: OwnedProjectListQueryDto,
  ): Promise<ProjectListResponse> {
    return this.projectsService.findOwnedProjects(user.id, query);
  }

  @Get(':id')
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: ProjectResponse,
  })
  @ApiNotFoundResponse({
    description: 'Project was not found.',
  })
  findById(@Param('id', ParseUUIDPipe) id: string): Promise<ProjectResponse> {
    return this.projectsService.findPublishedProject(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
  @ApiBearerAuth('jwt')
  @ApiParam({
    name: 'id',
    format: 'uuid',
  })
  @ApiOkResponse({
    type: ProjectResponse,
  })
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<ProjectResponse> {
    return this.projectsService.publishProject(id, user.id, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent'),
    });
  }
}

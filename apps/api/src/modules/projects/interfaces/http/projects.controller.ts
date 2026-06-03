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
  ProjectStatus,
  UserRole,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { OptionalEnumPipe } from '@app/common';
import { AuthenticatedUser } from '../../../identity/application/authenticated-user';
import { CurrentUser } from '../../../identity/interfaces/http/decorators/current-user.decorator';
import { Roles } from '../../../identity/interfaces/http/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../identity/interfaces/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../../identity/interfaces/http/guards/roles.guard';
import { ProjectsService } from '../../services/projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectListResponse, ProjectResponse } from './presenters/project.presenter';

function parseSkillQuery(value?: string | string[]): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const skills = (Array.isArray(value) ? value : [value])
    .flatMap((item) => item.split(','))
    .map((skill) => skill.trim())
    .filter(Boolean);

  return skills.length ? skills : undefined;
}

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
    name: 'search',
    required: false,
    type: String,
    example: 'contract platform',
  })
  @ApiQuery({
    name: 'skill',
    required: false,
    type: String,
    isArray: true,
    example: ['nestjs', 'react'],
    description: 'Repeat the parameter for multiple skills: ?skill=nestjs&skill=react.',
  })
  @ApiOkResponse({
    type: ProjectListResponse,
  })
  findPublished(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('skill') skill?: string | string[],
  ): Promise<ProjectListResponse> {
    return this.projectsService.findPublishedProjects({
      page,
      limit,
      search,
      skill: parseSkillQuery(skill),
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CLIENT)
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
    enum: ProjectStatus,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'contract platform',
  })
  @ApiQuery({
    name: 'skill',
    required: false,
    type: String,
    isArray: true,
    example: ['nestjs', 'react'],
    description: 'Repeat the parameter for multiple skills: ?skill=nestjs&skill=react.',
  })
  @ApiOkResponse({
    type: ProjectListResponse,
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status', new OptionalEnumPipe(ProjectStatus)) status?: ProjectStatus,
    @Query('search') search?: string,
    @Query('skill') skill?: string | string[],
  ): Promise<ProjectListResponse> {
    return this.projectsService.findOwnedProjects(user.id, {
      page,
      limit,
      status,
      search,
      skill: parseSkillQuery(skill),
    });
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

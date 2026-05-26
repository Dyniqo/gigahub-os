import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createPaginationMeta,
  getPaginationOffset,
  normalizePagination,
  PaginatedResult,
  PrismaService,
} from '@app/common';
import { Prisma, ProjectStatus } from '@app/common/infrastructure/database/generated/prisma/client';
import { AuditAction } from '../../audit-log/domain/audit-action';
import { AuditResource } from '../../audit-log/domain/audit-resource';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { CreateProjectDto } from '../interfaces/http/dto/create-project.dto';
import { OwnedProjectListQueryDto } from '../interfaces/http/dto/owned-project-list-query.dto';
import { ProjectListQueryDto } from '../interfaces/http/dto/project-list-query.dto';
import { ProjectResponse } from '../interfaces/http/presenters/project.presenter';

type ProjectRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const projectSelect = {
  id: true,
  clientId: true,
  title: true,
  description: true,
  status: true,
  budgetMin: true,
  budgetMax: true,
  currency: true,
  publishedAt: true,
  closedAt: true,
  skills: {
    select: {
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  },
  createdAt: true,
  updatedAt: true,
  version: true,
} satisfies Prisma.ProjectSelect;

const publishableProjectStatuses: ProjectStatus[] = [ProjectStatus.DRAFT, ProjectStatus.PAUSED];

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createProject(
    clientId: string,
    dto: CreateProjectDto,
    context: ProjectRequestContext,
  ): Promise<ProjectResponse> {
    this.assertValidBudgetRange(dto);

    const projectData = this.createProjectData(clientId, dto);

    const project = await this.prismaService.$transaction(async (transaction) => {
      const createdProject = await transaction.project.create({
        data: projectData,
        select: projectSelect,
      });

      await this.auditLogService.record(
        {
          actorId: clientId,
          action: AuditAction.PROJECT_CREATED,
          resourceType: AuditResource.PROJECT,
          resourceId: createdProject.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        transaction,
      );

      return createdProject;
    });

    return ProjectResponse.fromRecord(project);
  }

  async publishProject(
    projectId: string,
    clientId: string,
    context: ProjectRequestContext,
  ): Promise<ProjectResponse> {
    const project = await this.prismaService.project.findFirst({
      where: {
        id: projectId,
        clientId,
        deletedAt: null,
      },
      select: projectSelect,
    });

    if (!project) {
      throw new NotFoundException('Project was not found');
    }

    if (project.status === ProjectStatus.PUBLISHED) {
      return ProjectResponse.fromRecord(project);
    }

    if (!publishableProjectStatuses.includes(project.status)) {
      throw new BadRequestException('Project cannot be published from its current status');
    }

    const publishedProject = await this.prismaService.$transaction(async (transaction) => {
      const result = await transaction.project.updateMany({
        where: {
          id: project.id,
          version: project.version,
        },
        data: {
          status: ProjectStatus.PUBLISHED,
          publishedAt: new Date(),
          version: {
            increment: 1,
          },
        },
      });

      if (result.count !== 1) {
        throw new ConflictException('Project was modified by another request');
      }

      const updatedProject = await transaction.project.findUniqueOrThrow({
        where: {
          id: project.id,
        },
        select: projectSelect,
      });

      await this.auditLogService.record(
        {
          actorId: clientId,
          action: AuditAction.PROJECT_PUBLISHED,
          resourceType: AuditResource.PROJECT,
          resourceId: updatedProject.id,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        },
        transaction,
      );

      return updatedProject;
    });

    return ProjectResponse.fromRecord(publishedProject);
  }

  async findPublishedProjects(
    query: ProjectListQueryDto,
  ): Promise<PaginatedResult<ProjectResponse>> {
    const pagination = normalizePagination(query);
    const where = this.createPublishedProjectsWhere(query);
    const [projects, total] = await this.prismaService.$transaction([
      this.prismaService.project.findMany({
        where,
        select: projectSelect,
        orderBy: [
          {
            publishedAt: 'desc',
          },
          {
            createdAt: 'desc',
          },
        ],
        skip: getPaginationOffset(pagination.page, pagination.limit),
        take: pagination.limit,
      }),
      this.prismaService.project.count({
        where,
      }),
    ]);

    return {
      items: projects.map(ProjectResponse.fromRecord),
      meta: createPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findOwnedProjects(
    clientId: string,
    query: OwnedProjectListQueryDto,
  ): Promise<PaginatedResult<ProjectResponse>> {
    const pagination = normalizePagination(query);
    const where = this.createOwnedProjectsWhere(clientId, query);
    const [projects, total] = await this.prismaService.$transaction([
      this.prismaService.project.findMany({
        where,
        select: projectSelect,
        orderBy: {
          createdAt: 'desc',
        },
        skip: getPaginationOffset(pagination.page, pagination.limit),
        take: pagination.limit,
      }),
      this.prismaService.project.count({
        where,
      }),
    ]);

    return {
      items: projects.map(ProjectResponse.fromRecord),
      meta: createPaginationMeta(pagination.page, pagination.limit, total),
    };
  }

  async findPublishedProject(projectId: string): Promise<ProjectResponse> {
    const project = await this.prismaService.project.findFirst({
      where: {
        id: projectId,
        status: ProjectStatus.PUBLISHED,
        deletedAt: null,
      },
      select: projectSelect,
    });

    if (!project) {
      throw new NotFoundException('Project was not found');
    }

    return ProjectResponse.fromRecord(project);
  }

  private createProjectData(clientId: string, dto: CreateProjectDto): Prisma.ProjectCreateInput {
    const skills = this.normalizeSkills(dto.skills);

    return {
      client: {
        connect: {
          id: clientId,
        },
      },
      title: dto.title.trim(),
      description: dto.description.trim(),
      budgetMin: dto.budgetMin === undefined ? null : new Prisma.Decimal(dto.budgetMin),
      budgetMax: dto.budgetMax === undefined ? null : new Prisma.Decimal(dto.budgetMax),
      currency: dto.currency?.trim().toUpperCase() ?? 'USD',
      skills:
        skills.length === 0
          ? undefined
          : {
              create: skills.map((name) => ({
                name,
              })),
            },
    };
  }

  private createPublishedProjectsWhere(query: ProjectListQueryDto): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {
      status: ProjectStatus.PUBLISHED,
      deletedAt: null,
    };

    this.applySearchFilters(where, query);

    return where;
  }

  private createOwnedProjectsWhere(
    clientId: string,
    query: OwnedProjectListQueryDto,
  ): Prisma.ProjectWhereInput {
    const where: Prisma.ProjectWhereInput = {
      clientId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    this.applySearchFilters(where, query);

    return where;
  }

  private applySearchFilters(where: Prisma.ProjectWhereInput, query: ProjectListQueryDto): void {
    const search = query.search?.trim();
    const skill = query.skill?.trim().toLowerCase();

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          description: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      ];
    }

    if (skill) {
      where.skills = {
        some: {
          name: {
            equals: skill,
            mode: Prisma.QueryMode.insensitive,
          },
        },
      };
    }
  }

  private assertValidBudgetRange(dto: CreateProjectDto): void {
    if (dto.budgetMin === undefined || dto.budgetMax === undefined) {
      return;
    }

    if (dto.budgetMin > dto.budgetMax) {
      throw new BadRequestException('Minimum budget cannot be greater than maximum budget');
    }
  }

  private normalizeSkills(skills?: string[]): string[] {
    if (!skills) {
      return [];
    }

    return Array.from(
      new Set(
        skills.map((skill) => skill.trim().toLowerCase()).filter((skill) => skill.length > 0),
      ),
    );
  }
}

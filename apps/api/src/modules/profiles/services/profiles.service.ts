import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { Prisma } from '@app/common/infrastructure/database/generated/prisma/client';
import { AuditAction } from '../../audit-log/domain/audit-action';
import { AuditResource } from '../../audit-log/domain/audit-resource';
import { AuditLogService } from '../../audit-log/services/audit-log.service';
import { UpsertProfileDto } from '../interfaces/http/dto/upsert-profile.dto';
import { ProfileResponse } from '../interfaces/http/presenters/profile.presenter';

type ProfileRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

const profileSelect = {
  id: true,
  userId: true,
  type: true,
  displayName: true,
  headline: true,
  bio: true,
  avatarUrl: true,
  countryCode: true,
  timezone: true,
  hourlyRate: true,
  currency: true,
  skills: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProfileSelect;

@Injectable()
export class ProfilesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async findCurrentUserProfile(userId: string): Promise<ProfileResponse> {
    const profile = await this.prismaService.profile.findUnique({
      where: {
        userId,
      },
      select: profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Profile was not found');
    }

    return ProfileResponse.fromRecord(profile);
  }

  async findProfile(profileId: string): Promise<ProfileResponse> {
    const profile = await this.prismaService.profile.findUnique({
      where: {
        id: profileId,
      },
      select: profileSelect,
    });

    if (!profile) {
      throw new NotFoundException('Profile was not found');
    }

    return ProfileResponse.fromRecord(profile);
  }

  async upsertCurrentUserProfile(
    userId: string,
    dto: UpsertProfileDto,
    context: ProfileRequestContext,
  ): Promise<ProfileResponse> {
    const profileData = this.createProfileData(dto);
    const profile = await this.prismaService.profile.upsert({
      where: {
        userId,
      },
      create: {
        ...profileData,
        user: {
          connect: {
            id: userId,
          },
        },
      },
      update: profileData,
      select: profileSelect,
    });

    await this.auditLogService.record({
      actorId: userId,
      action: AuditAction.PROFILE_UPSERTED,
      resourceType: AuditResource.PROFILE,
      resourceId: profile.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return ProfileResponse.fromRecord(profile);
  }

  private createProfileData(dto: UpsertProfileDto) {
    return {
      type: dto.type,
      displayName: this.normalizeRequiredText(dto.displayName),
      headline: this.normalizeOptionalText(dto.headline),
      bio: this.normalizeOptionalText(dto.bio),
      avatarUrl: this.normalizeOptionalText(dto.avatarUrl),
      countryCode: this.normalizeOptionalCode(dto.countryCode),
      timezone: this.normalizeOptionalText(dto.timezone),
      hourlyRate: dto.hourlyRate === undefined ? null : new Prisma.Decimal(dto.hourlyRate),
      currency: this.normalizeOptionalCode(dto.currency),
      skills: this.normalizeSkills(dto.skills),
    };
  }

  private normalizeRequiredText(value: string): string {
    return value.trim();
  }

  private normalizeOptionalText(value?: string): string | null {
    const normalized = value?.trim();

    if (!normalized) {
      return null;
    }

    return normalized;
  }

  private normalizeOptionalCode(value?: string): string | null {
    const normalized = value?.trim().toUpperCase();

    if (!normalized) {
      return null;
    }

    return normalized;
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

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma, ProfileType } from '@app/common/infrastructure/database/generated/prisma/client';

export type ProfileRecord = {
  id: string;
  userId: string;
  type: ProfileType;
  displayName: string;
  headline: string | null;
  bio: string | null;
  avatarUrl: string | null;
  countryCode: string | null;
  timezone: string | null;
  hourlyRate: Prisma.Decimal | null;
  currency: string | null;
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
};

export class ProfileResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
  })
  userId!: string;

  @ApiProperty({
    enum: ProfileType,
  })
  type!: ProfileType;

  @ApiProperty()
  displayName!: string;

  @ApiPropertyOptional({
    nullable: true,
  })
  headline!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  bio!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  countryCode!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  timezone!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  hourlyRate!: string | null;

  @ApiPropertyOptional({
    nullable: true,
  })
  currency!: string | null;

  @ApiProperty({
    type: [String],
  })
  skills!: string[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromRecord(profile: ProfileRecord): ProfileResponse {
    return {
      id: profile.id,
      userId: profile.userId,
      type: profile.type,
      displayName: profile.displayName,
      headline: profile.headline,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      countryCode: profile.countryCode,
      timezone: profile.timezone,
      hourlyRate: profile.hourlyRate?.toString() ?? null,
      currency: profile.currency,
      skills: profile.skills,
      createdAt: profile.createdAt.toISOString(),
      updatedAt: profile.updatedAt.toISOString(),
    };
  }
}

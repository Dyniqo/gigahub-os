import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfileType } from '@app/common/infrastructure/database/generated/prisma/client';

export class UpsertProfileDto {
  @ApiProperty({
    enum: ProfileType,
  })
  @IsEnum(ProfileType)
  type!: ProfileType;

  @ApiProperty({
    example: 'GigaHub Client',
  })
  @IsString()
  @MaxLength(120)
  displayName!: string;

  @ApiPropertyOptional({
    example: 'Building high-quality marketplace products',
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  headline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bio?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(2048)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'US',
  })
  @IsOptional()
  @Length(2, 2)
  @Matches(/^[A-Za-z]{2}$/)
  countryCode?: string;

  @ApiPropertyOptional({
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[A-Za-z_]+\/[A-Za-z0-9_+-]+(?:\/[A-Za-z0-9_+-]+)?$/)
  timezone?: string;

  @ApiPropertyOptional({
    example: 75,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 4,
  })
  @Min(0)
  @Max(1000000)
  hourlyRate?: number;

  @ApiPropertyOptional({
    example: 'USD',
  })
  @IsOptional()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  currency?: string;

  @ApiPropertyOptional({
    example: ['nestjs', 'postgresql', 'event-driven-architecture'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({
    each: true,
  })
  @MaxLength(80, {
    each: true,
  })
  skills?: string[];
}

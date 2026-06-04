import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function toSkillArray({ value }: { value: unknown }): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];
  const skills = values
    .flatMap((item) => String(item).split(','))
    .map((skill) => skill.trim())
    .filter(Boolean);

  return skills.length ? skills : undefined;
}

export class ProjectListQueryDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @ApiPropertyOptional({
    type: [String],
    isArray: true,
    example: ['nestjs', 'react'],
    description:
      'Repeat skill query params, for example ?skill=nestjs&skill=react. Comma-separated values are also accepted.',
  })
  @IsOptional()
  @Transform(toSkillArray)
  @IsArray()
  @ArrayMaxSize(25)
  @IsString({
    each: true,
  })
  @MaxLength(80, {
    each: true,
  })
  skill?: string[];
}

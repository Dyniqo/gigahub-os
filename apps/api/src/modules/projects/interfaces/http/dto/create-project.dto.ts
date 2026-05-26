import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({
    example: 'Build a contract and escrow platform API',
  })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiProperty()
  @IsString()
  @MaxLength(8000)
  description!: string;

  @ApiPropertyOptional({
    example: 1500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 4,
  })
  @Min(0)
  @Max(100000000)
  budgetMin?: number;

  @ApiPropertyOptional({
    example: 5000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 4,
  })
  @Min(0)
  @Max(100000000)
  budgetMax?: number;

  @ApiPropertyOptional({
    example: 'USD',
  })
  @IsOptional()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  currency?: string;

  @ApiPropertyOptional({
    example: ['nestjs', 'postgresql', 'escrow'],
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

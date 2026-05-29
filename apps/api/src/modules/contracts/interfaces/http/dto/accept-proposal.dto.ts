import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsISO8601,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ContractMilestoneDto {
  @ApiProperty({
    example: 'Architecture and foundation',
  })
  @IsString()
  @MaxLength(160)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty({
    example: 1200,
  })
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 4,
  })
  @Min(1)
  @Max(100000000)
  amount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  dueAt?: string;
}

export class AcceptProposalDto {
  @ApiProperty({
    type: [ContractMilestoneDto],
  })
  @ArrayMinSize(1)
  @ArrayMaxSize(25)
  @ValidateNested({
    each: true,
  })
  @Type(() => ContractMilestoneDto)
  milestones!: ContractMilestoneDto[];

  @ApiPropertyOptional({
    type: Object,
  })
  @IsOptional()
  @IsObject()
  terms?: Record<string, string | number | boolean | null>;
}

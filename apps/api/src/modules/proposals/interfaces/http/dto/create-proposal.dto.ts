import { Type } from 'class-transformer';
import {
  IsInt,
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

export class CreateProposalDto {
  @ApiProperty()
  @IsString()
  @MaxLength(8000)
  coverLetter!: string;

  @ApiProperty({
    example: 2500,
  })
  @Type(() => Number)
  @IsNumber({
    maxDecimalPlaces: 4,
  })
  @Min(1)
  @Max(100000000)
  proposedAmount!: number;

  @ApiPropertyOptional({
    example: 'USD',
  })
  @IsOptional()
  @Length(3, 3)
  @Matches(/^[A-Za-z]{3}$/)
  currency?: string;

  @ApiProperty({
    example: 21,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  deliveryDays!: number;
}

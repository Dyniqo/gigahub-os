import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DisputeMilestoneDto {
  @ApiProperty({
    example: 'The delivered scope does not match the approved milestone acceptance criteria.',
  })
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  reason!: string;

  @ApiPropertyOptional({
    example: [
      '[https://example.com/evidence/scope-review.pdf](https://example.com/evidence/scope-review.pdf)',
    ],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({
    each: true,
  })
  @MaxLength(500, {
    each: true,
  })
  evidenceUrls?: string[];
}

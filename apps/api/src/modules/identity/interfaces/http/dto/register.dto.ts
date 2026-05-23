import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { RegistrationRole } from '../../../domain/registration-role';

export class RegisterDto {
  @ApiProperty({
    example: 'client@gigahub.local',
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({
    minLength: 12,
    maxLength: 128,
  })
  @IsString()
  @MinLength(12)
  @MaxLength(128)
  password!: string;

  @ApiProperty({
    enum: RegistrationRole,
  })
  @IsEnum(RegistrationRole)
  role!: RegistrationRole;
}

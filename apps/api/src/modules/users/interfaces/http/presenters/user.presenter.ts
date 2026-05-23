import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@app/common/infrastructure/database/generated/prisma/client';

export type UserRecord = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class UserResponse {
  @ApiProperty({
    format: 'uuid',
  })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({
    enum: UserRole,
  })
  role!: UserRole;

  @ApiProperty({
    enum: UserStatus,
  })
  status!: UserStatus;

  @ApiPropertyOptional({
    nullable: true,
  })
  emailVerifiedAt!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  static fromRecord(user: UserRecord): UserResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

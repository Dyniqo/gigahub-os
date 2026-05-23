import { UserRole } from '@app/common/infrastructure/database/generated/prisma/client';

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

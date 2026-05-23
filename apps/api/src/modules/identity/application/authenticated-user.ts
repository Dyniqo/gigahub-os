import { UserRole, UserStatus } from '@app/common/infrastructure/database/generated/prisma/client';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};

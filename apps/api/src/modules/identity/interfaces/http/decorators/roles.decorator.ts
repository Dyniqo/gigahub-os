import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@app/common/infrastructure/database/generated/prisma/client';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@app/common/infrastructure/database/generated/prisma/client';
import { AuthenticatedUser } from '../../../application/authenticated-user';
import { ROLES_KEY } from '../decorators/roles.decorator';

type RequestWithUser = {
  user?: AuthenticatedUser;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    return Boolean(request.user && roles.includes(request.user.role));
  }
}

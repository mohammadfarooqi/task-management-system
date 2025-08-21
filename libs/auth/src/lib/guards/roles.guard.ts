import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorators';
import { RoleType, hasPermission } from '@task-management-system/data';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request (set by JwtGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles: string[] = user.roles || [];

    // Map string roles to RoleType enum (handle both cases)
    const userRoleTypes = userRoles.map(role => {
      // Handle both 'Owner' and 'OWNER' formats
      const upperRole = role.toUpperCase();
      return RoleType[upperRole as keyof typeof RoleType];
    }).filter(Boolean);

    // Check if user has permission for at least one of the required roles
    // Using role hierarchy: Owner > Admin > Viewer
    const hasRequiredPermission = requiredRoles.some(requiredRole =>
      userRoleTypes.some(userRole => hasPermission(userRole, requiredRole))
    );

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your roles: ${userRoles.join(', ') || 'none'}`
      );
    }

    return true;
  }
}
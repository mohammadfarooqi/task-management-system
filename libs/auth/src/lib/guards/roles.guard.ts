import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/auth.decorators';
import { RoleType } from '@task-management-system/data';

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

    const userRole = user?.role;

    // If no user or no role, throw with appropriate message
    if (!userRole) {
      throw new ForbiddenException(
        `User role ${userRole} is not authorized. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    // SystemAdmin has access to everything
    if (userRole === 'SystemAdmin') {
      return true;
    }

    // Check if user's role matches any of the required roles
    // Compare the role string value directly with the RoleType enum values
    const hasRequiredPermission = requiredRoles.some(requiredRole => {
      // requiredRole is a RoleType enum value (e.g., 'SystemAdmin')
      return userRole === requiredRole;
    });

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `User role ${userRole} is not authorized. Required roles: ${requiredRoles.join(', ')}`
      );
    }

    return true;
  }
}
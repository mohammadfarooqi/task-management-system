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

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get the user's single role from JWT
    const userRole = user.role;

    if (!userRole) {
      throw new ForbiddenException(
        `Access denied. No role found for user.`
      );
    }

    // Check if user's role matches any of the required roles
    // Compare the role string value directly with the RoleType enum values
    const hasRequiredPermission = requiredRoles.some(requiredRole => {
      // requiredRole is a RoleType enum value (e.g., 'SystemAdmin')
      return userRole === requiredRole;
    });

    if (!hasRequiredPermission) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}. Your role: ${userRole}`
      );
    }

    return true;
  }
}
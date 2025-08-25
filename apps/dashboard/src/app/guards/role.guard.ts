import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RoleType } from '@task-management-system/data';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) {
      // Not authenticated, redirect to login
      return this.router.createUrlTree(['/login']);
    }

    // Get required roles from route data
    const requiredRoles = route.data['roles'] as string[];
    
    if (!requiredRoles || requiredRoles.length === 0) {
      // No specific roles required, just authentication
      return true;
    }

    // Check if user has one of the required roles
    if (requiredRoles.includes(currentUser.role)) {
      return true;
    }

    // User doesn't have required role, redirect to dashboard
    console.warn(`Access denied. Required roles: ${requiredRoles.join(', ')}. User role: ${currentUser.role}`);
    return this.router.createUrlTree(['/dashboard']);
  }
}
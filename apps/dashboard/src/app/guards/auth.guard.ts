import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Check if user is logged in by checking if current user exists
    // Token is now in HttpOnly cookie and not accessible from JavaScript
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      // User exists, they are authenticated
      return true;
    }
    
    // No user, redirect to login
    return this.router.createUrlTree(['/login']);
  }
}
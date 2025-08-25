import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  // Define public routes that don't need authentication
  const publicRoutes = [
    '/auth/login',
    '/auth/logout',
  ];

  // Check if this is a public route
  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Clone the request and add withCredentials for cookie support
  const authReq = req.clone({
    withCredentials: true
  });

  // Handle the request and catch 401 errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicRoute) {
        // Token is expired or invalid - logout and redirect
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
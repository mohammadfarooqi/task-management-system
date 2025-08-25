import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginDto, LoginResponseDto, ApiResponse, JwtPayload } from '@task-management-system/data';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  role: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Check if user is already logged in by calling profile endpoint
    this.loadCurrentUser();
  }

  login(credentials: LoginDto): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(
      `${this.apiUrl}/auth/login`, 
      credentials,
      { withCredentials: true } // Important for cookies
    ).pipe(
      tap(response => {
        if (response.success && response.data) {
          // Token is now in HttpOnly cookie, not in response
          // Update current user subject with user data from response
          this.currentUserSubject.next({
            ...response.data.user,
            role: response.data.role
          });
        }
      })
    );
  }

  logout(): void {
    // Call logout endpoint to clear HttpOnly cookie
    this.http.post<ApiResponse<void>>(
      `${this.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).subscribe({
      next: () => {
        // Clear current user
        this.currentUserSubject.next(null);
        // Navigate to login page
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even if logout fails, clear user and navigate to login
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
      }
    });
  }

  // Token is now in HttpOnly cookie, not accessible from JavaScript
  // This method is kept for backward compatibility but always returns null
  getToken(): string | null {
    return null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  private loadCurrentUser(): void {
    // Try to get user profile from backend (will work if cookie is valid)
    this.http.get<ApiResponse<JwtPayload>>(
      `${this.apiUrl}/auth/profile`,
      { withCredentials: true }
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const user: User = {
            id: response.data.sub,
            email: response.data.email,
            firstName: response.data.firstName,
            lastName: response.data.lastName,
            organizationId: response.data.organizationId,
            role: response.data.role,
            isActive: true
          };
          this.currentUserSubject.next(user);
        }
      },
      error: () => {
        // User is not logged in or session expired
        this.currentUserSubject.next(null);
      }
    });
  }
}
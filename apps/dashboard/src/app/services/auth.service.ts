import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginDto, LoginResponseDto, ApiResponse, JwtPayload } from '@task-management-system/data';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

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

  constructor(private http: HttpClient) {
    // Check if user is already logged in on service initialization
    this.loadUserFromStorage();
  }

  login(credentials: LoginDto): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            // Store only the token
            window.localStorage.setItem('accessToken', response.data.accessToken);

            // Update current user subject with decoded token data
            this.currentUserSubject.next({
              ...response.data.user,
              role: response.data.role
            });
          }
        })
      );
  }

  logout(): void {
    // Clear only the token from localStorage
    window.localStorage.removeItem('accessToken');

    // Clear current user
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return window.localStorage.getItem('accessToken');
  }

  getCurrentUser(): User | null {
    // If we have a cached user, return it
    if (this.currentUserSubject.value) {
      return this.currentUserSubject.value;
    }

    // Otherwise, try to decode the token
    const token = this.getToken();
    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        const user: User = {
          id: decoded.sub,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          organizationId: decoded.organizationId,
          role: decoded.role,
          isActive: true // User must be active to have valid JWT
        };
        this.currentUserSubject.next(user);
        return user;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();

    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          this.logout();
          return;
        }

        // Set user from JWT payload
        const user: User = {
          id: decoded.sub,
          email: decoded.email,
          firstName: decoded.firstName,
          lastName: decoded.lastName,
          organizationId: decoded.organizationId,
          role: decoded.role,
          isActive: true // User must be active to have valid JWT
        };
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error decoding token:', error);
        this.logout();
      }
    }
  }
}
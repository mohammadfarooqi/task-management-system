import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoginDto, LoginResponseDto, ApiResponse } from '@task-management-system/data';
import { environment } from '../../environments/environment';

export interface User extends Omit<LoginResponseDto['user'], 'createdAt' | 'updatedAt'> {
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
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
            // Store token and user info
            localStorage.setItem('accessToken', response.data.accessToken);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('userRole', response.data.role);

            // Update current user subject
            this.currentUserSubject.next({
              ...response.data.user,
              role: response.data.role
            });
          }
        })
      );
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');

    // Clear current user
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private loadUserFromStorage(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('userRole');

    if (token && userStr && role) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next({ ...user, role });
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
        this.logout();
      }
    }
  }
}
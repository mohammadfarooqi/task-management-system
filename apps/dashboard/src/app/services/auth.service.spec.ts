import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store user data', () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          },
          accessToken: 'mock-jwt-token',
          role: 'Admin'
        },
        message: 'Login successful'
      };

      service.login({ email: 'test@example.com', password: 'password' }).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password' });
      req.flush(mockResponse);

      // Check that only token is stored in localStorage
      expect(localStorage.getItem('accessToken')).toBe('mock-jwt-token');
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('userRole')).toBeNull();
    });

    it('should handle login failure', () => {
      const mockError = {
        error: { message: 'Invalid credentials' },
        status: 401
      };

      service.login({ email: 'test@example.com', password: 'wrong-password' }).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockError.error, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('logout', () => {
    it('should clear token from localStorage on logout', () => {
      // Setup: Add token to localStorage
      localStorage.setItem('accessToken', 'test-token');

      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      localStorage.setItem('accessToken', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null when no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should decode JWT and return user data', () => {
      // Create a mock JWT token with proper payload
      // This is a real JWT with payload: {sub: 1, email: 'test@example.com', organizationId: 1, role: 'Admin'}
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm9yZ2FuaXphdGlvbklkIjoxLCJyb2xlIjoiQWRtaW4iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6OTk5OTk5OTk5OX0.signature';
      localStorage.setItem('accessToken', mockJWT);
      
      const currentUser = service.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser?.id).toBe(1);
      expect(currentUser?.email).toBe('test@example.com');
      expect(currentUser?.organizationId).toBe(1);
      expect(currentUser?.role).toBe('Admin');
    });

    it('should return null when no token exists', () => {
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should return null for invalid token', () => {
      localStorage.setItem('accessToken', 'invalid-token');
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});

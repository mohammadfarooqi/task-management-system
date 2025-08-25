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

      // Check localStorage
      expect(localStorage.getItem('accessToken')).toBe('mock-jwt-token');
      expect(service.getCurrentUser()).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'Admin'
      });
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
    it('should clear localStorage on logout', () => {
      // Setup: Add items to localStorage
      localStorage.setItem('accessToken', 'test-token');
      localStorage.setItem('user', JSON.stringify({ id: 1, email: 'test@example.com' }));
      localStorage.setItem('userRole', 'Admin');

      service.logout();

      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('userRole')).toBeNull();
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
    it('should return user after successful login', () => {
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

      service.login({ email: 'test@example.com', password: 'password' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(mockResponse);
      
      const currentUser = service.getCurrentUser();
      expect(currentUser).toEqual({
        ...mockResponse.data.user,
        role: mockResponse.data.role
      });
    });

    it('should return null when no user in localStorage', () => {
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerMock: { navigate: jest.Mock };

  beforeEach(() => {
    routerMock = {
      navigate: jest.fn()
    };
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerMock }
      ]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  // Handle initial profile load that happens in constructor
  const handleInitialProfileRequest = () => {
    const req = httpMock.match(`${environment.apiUrl}/auth/profile`);
    req.forEach(request => request.flush(
      { error: 'Not logged in' },
      { status: 401, statusText: 'Unauthorized' }
    ));
  };

  it('should be created', () => {
    handleInitialProfileRequest();
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store user data', () => {
      handleInitialProfileRequest();
      
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          },
          // Token is no longer in response since it's in cookie
          role: 'Admin'
        },
        message: 'Login successful'
      };

      service.login({ email: 'test@example.com', password: 'password' }).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      expect(req.request.body).toEqual({ email: 'test@example.com', password: 'password' });
      req.flush(mockResponse);

      // Token is now in HttpOnly cookie, not localStorage
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('userRole')).toBeNull();
    });

    it('should handle login failure', () => {
      handleInitialProfileRequest();
      
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
    it('should call logout endpoint, clear user data, and navigate to login', () => {
      handleInitialProfileRequest();
      
      const mockResponse = {
        success: true,
        message: 'Logout successful'
      };

      // Call logout (now void)
      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBe(true);
      req.flush(mockResponse);

      // Verify navigation was called
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      expect(service.getCurrentUser()).toBeNull();
    });

    it('should navigate to login even if logout fails', () => {
      handleInitialProfileRequest();
      
      // Call logout
      service.logout();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({ error: 'Logout failed' }, { status: 500, statusText: 'Server Error' });

      // Should still navigate to login
      expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('getToken', () => {
    it('should always return null (tokens are in HttpOnly cookies)', () => {
      handleInitialProfileRequest();
      // Even if we try to set a token in localStorage, it should return null
      localStorage.setItem('accessToken', 'test-token');
      expect(service.getToken()).toBeNull();
    });

    it('should return null when no token exists', () => {
      handleInitialProfileRequest();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return cached user data when available', () => {
      handleInitialProfileRequest();
      
      // Simulate successful login to cache user data
      const mockLoginResponse = {
        success: true,
        data: {
          user: {
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          },
          role: 'Admin'
        },
        message: 'Login successful'
      };

      service.login({ email: 'test@example.com', password: 'password' }).subscribe();
      const loginReq = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      loginReq.flush(mockLoginResponse);

      const currentUser = service.getCurrentUser();
      expect(currentUser).toBeTruthy();
      expect(currentUser?.id).toBe(1);
      expect(currentUser?.email).toBe('test@example.com');
      expect(currentUser?.firstName).toBe('Test');
      expect(currentUser?.lastName).toBe('User');
      expect(currentUser?.role).toBe('Admin');
    });

    it('should return null when no user is logged in', () => {
      handleInitialProfileRequest();
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});

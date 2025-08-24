import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtGuard } from './jwt.guard';

describe('JwtGuard', () => {
  let guard: JwtGuard;
  let reflector: Reflector;
  let jwtService: JwtService;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn(),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    guard = module.get<JwtGuard>(JwtGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for public routes', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('should validate and allow valid JWT token', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      };

      const mockPayload = {
        sub: 1,
        email: 'test@example.com',
        organizationId: 1,
        role: 'Admin',
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
        mockRequest
      );
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt-token', {
        secret: expect.any(String),
      });
      expect(mockRequest['user']).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException when no authorization header', async () => {
      const mockRequest = {
        headers: {},
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
        mockRequest
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when authorization header is malformed', async () => {
      const mockRequest = {
        headers: {
          authorization: 'InvalidFormat',
        },
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
        mockRequest
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid-jwt-token',
        },
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
        mockRequest
      );
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer expired-jwt-token',
        },
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
        mockRequest
      );
      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('TokenExpiredError')
      );

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should handle Bearer token with extra spaces', async () => {
      const mockRequest = {
        headers: {
          authorization: '  Bearer   valid-jwt-token  ',
        },
      };

      const mockPayload = {
        sub: 1,
        email: 'test@example.com',
        organizationId: 1,
        role: 'Admin',
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
        mockRequest
      );
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt-token', {
        secret: expect.any(String),
      });
    });

    it('should attach user payload to request object', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid-jwt-token',
        },
      };

      const mockPayload = {
        sub: 2,
        email: 'admin@example.com',
        organizationId: 1,
        role: 'Owner',
      };

      mockReflector.getAllAndOverride.mockReturnValue(false);
      (mockExecutionContext.switchToHttp().getRequest as jest.Mock).mockReturnValue(
        mockRequest
      );
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      await guard.canActivate(mockExecutionContext);

      expect(mockRequest['user']).toEqual(mockPayload);
      expect(mockRequest['user'].sub).toBe(2);
      expect(mockRequest['user'].role).toBe('Owner');
    });
  });
});
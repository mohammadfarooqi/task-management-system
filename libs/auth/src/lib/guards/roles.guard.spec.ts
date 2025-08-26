import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesGuard } from './roles.guard';
import { RoleType } from '@task-management-system/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const createMockExecutionContext = (user: any): ExecutionContext => ({
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ role: RoleType.VIEWER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should return true when user has SystemAdmin role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const context = createMockExecutionContext({ role: RoleType.SYSTEM_ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user role matches required role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const context = createMockExecutionContext({ role: RoleType.ADMIN });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user role is in list of required roles', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        RoleType.ADMIN,
        RoleType.OWNER,
      ]);
      const context = createMockExecutionContext({ role: RoleType.OWNER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user role is not allowed', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        RoleType.ADMIN,
        RoleType.OWNER,
      ]);
      const context = createMockExecutionContext({ role: RoleType.VIEWER });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User role Viewer is not authorized. Required roles: Admin, Owner'
      );
    });

    it('should throw ForbiddenException when user has no role', () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const context = createMockExecutionContext({ email: 'test@test.com' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User role undefined is not authorized. Required roles: Admin'
      );
    });

    it('should throw ForbiddenException when user object is missing', () => {
      mockReflector.getAllAndOverride.mockReturnValue([RoleType.ADMIN]);
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User role undefined is not authorized. Required roles: Admin'
      );
    });

    it('should handle multiple required roles correctly', () => {
      mockReflector.getAllAndOverride.mockReturnValue([
        RoleType.SYSTEM_ADMIN,
        RoleType.OWNER,
        RoleType.ADMIN,
      ]);

      const adminContext = createMockExecutionContext({ role: RoleType.ADMIN });
      expect(guard.canActivate(adminContext)).toBe(true);

      const ownerContext = createMockExecutionContext({ role: RoleType.OWNER });
      expect(guard.canActivate(ownerContext)).toBe(true);

      const viewerContext = createMockExecutionContext({ role: RoleType.VIEWER });
      expect(() => guard.canActivate(viewerContext)).toThrow(ForbiddenException);
    });
  });
});
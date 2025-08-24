import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { UserRole } from '../entities/user-role.entity';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt at module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: '$2b$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    organizationId: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    getUserRoles: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockUserRoleRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(UserRole),
          useValue: mockUserRoleRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockRole = 'Admin';
      const mockToken = 'jwt-token';

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue(mockToken);
      mockUserRoleRepository.findOne.mockResolvedValue({
        role: { name: 'Admin' }
      });

      // Mock bcrypt.compare
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash
      );
      const { passwordHash, ...userWithoutPassword } = mockUser;
      expect(result).toEqual({
        user: userWithoutPassword,
        accessToken: mockToken,
        role: mockRole,
      });
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      const loginDto = {
        email: 'invalid@example.com',
        password: 'password123',
      };

      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const inactiveUser = { ...mockUser, isActive: false };
      mockUserService.findByEmail.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('validateUser', () => {
    it('should return user when valid userId provided', async () => {
      mockUserService.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(1);

      expect(userService.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserService.findById.mockResolvedValue(null);

      const result = await service.validateUser(999);

      expect(userService.findById).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });
  });
});
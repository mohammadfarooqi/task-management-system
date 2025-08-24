import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { Role, RoleType } from '../entities/role.entity';
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

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockUserRoleRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
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
          provide: getRepositoryToken(Role),
          useValue: mockRoleRepository,
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

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        organizationId: 1,
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      mockRoleRepository.findOne.mockResolvedValue({
        id: 3,
        name: RoleType.VIEWER,
      });
      mockUserRoleRepository.create.mockReturnValue({});
      mockUserRoleRepository.save.mockResolvedValue({});
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(userService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(userService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('email', registerDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'Existing',
        lastName: 'User',
        organizationId: 1,
      };

      mockUserService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should assign specified roleType when provided', async () => {
      const registerDto = {
        email: 'admin@example.com',
        password: 'password123',
        firstName: 'Admin',
        lastName: 'User',
        organizationId: 1,
        roleType: RoleType.ADMIN,
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      mockRoleRepository.findOne.mockResolvedValue({
        id: 2,
        name: RoleType.ADMIN,
      });
      mockUserRoleRepository.save.mockResolvedValue({});
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.register(registerDto);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: RoleType.ADMIN }
      });
      expect(mockUserRoleRepository.save).toHaveBeenCalledWith({
        userId: mockUser.id,
        roleId: 2,
      });
    });

    it('should default to VIEWER role when roleType not specified', async () => {
      const registerDto = {
        email: 'default@example.com',
        password: 'password123',
        firstName: 'Default',
        lastName: 'User',
        organizationId: 1,
        // roleType not specified
      };

      mockUserService.findByEmail.mockResolvedValue(null);
      mockUserService.create.mockResolvedValue({
        ...mockUser,
        email: registerDto.email,
      });
      mockRoleRepository.findOne.mockResolvedValue({
        id: 3,
        name: RoleType.VIEWER,
      });
      mockUserRoleRepository.save.mockResolvedValue({});
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await service.register(registerDto);

      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: RoleType.VIEWER }
      });
      expect(mockUserRoleRepository.save).toHaveBeenCalledWith({
        userId: mockUser.id,
        roleId: 3,
      });
    });
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
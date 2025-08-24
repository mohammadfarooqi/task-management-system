import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { RoleType } from '@task-management-system/data';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt at module level
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('UserService', () => {
  let service: UserService;

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

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockRoleRepository = {
    findOne: jest.fn(),
  };

  const mockUserRoleRepository = {
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
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

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findById(1);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('createUserWithRole', () => {
    const createUserData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      organizationId: 1,
    };

    it('should successfully create user with specified role', async () => {
      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        ...mockUser,
        email: createUserData.email,
        passwordHash: hashedPassword,
      };
      const mockRole = {
        id: 2,
        name: RoleType.ADMIN,
      };

      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockUserRoleRepository.save.mockResolvedValue({});

      const result = await service.createUserWithRole(createUserData, RoleType.ADMIN);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: createUserData.email },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserData.password, 12);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserData.email,
        passwordHash: hashedPassword,
        firstName: createUserData.firstName,
        lastName: createUserData.lastName,
        organizationId: createUserData.organizationId,
        isActive: true,
      });
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: RoleType.ADMIN },
      });
      expect(mockUserRoleRepository.save).toHaveBeenCalledWith({
        userId: savedUser.id,
        roleId: mockRole.id,
      });
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe(createUserData.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.createUserWithRole(createUserData, RoleType.VIEWER)
      ).rejects.toThrow(ConflictException);

      expect(mockUserRepository.save).not.toHaveBeenCalled();
      expect(mockRoleRepository.findOne).not.toHaveBeenCalled();
      expect(mockUserRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if role not found', async () => {
      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        ...mockUser,
        email: createUserData.email,
        passwordHash: hashedPassword,
      };

      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockRoleRepository.findOne.mockResolvedValue(null); // Role not found

      await expect(
        service.createUserWithRole(createUserData, RoleType.OWNER)
      ).rejects.toThrow(InternalServerErrorException);

      expect(mockUserRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should use custom salt rounds from environment variable', async () => {
      const originalEnv = process.env.BCRYPT_ROUNDS;
      process.env.BCRYPT_ROUNDS = '10';

      const hashedPassword = 'hashedPassword123';
      const savedUser = {
        ...mockUser,
        email: createUserData.email,
        passwordHash: hashedPassword,
      };
      const mockRole = {
        id: 3,
        name: RoleType.VIEWER,
      };

      mockUserRepository.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue(savedUser);
      mockRoleRepository.findOne.mockResolvedValue(mockRole);
      mockUserRoleRepository.save.mockResolvedValue({});

      await service.createUserWithRole(createUserData, RoleType.VIEWER);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserData.password, 10);

      // Restore original env
      process.env.BCRYPT_ROUNDS = originalEnv;
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, { ...mockUser, id: 2, email: 'user2@example.com' }];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(mockUserRepository.find).toHaveBeenCalled();
      expect(result).toEqual(users);
    });

    it('should return empty array when no users', async () => {
      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });
});
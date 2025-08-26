import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from '../services/user.service';
import { OrganizationService } from '../services/organization.service';
import { RoleType } from '@task-management-system/data';
import { ForbiddenException } from '@nestjs/common';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;
  let organizationService: OrganizationService;

  const mockUserService = {
    createUserWithRole: jest.fn(),
  };

  const mockOrganizationService = {
    isChildOrganization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
    organizationService = module.get<OrganizationService>(OrganizationService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    const mockUser = {
      id: 1,
      email: 'newuser@test.com',
      firstName: 'New',
      lastName: 'User',
      organizationId: 1,
      passwordHash: 'hash',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    describe('Owner permissions', () => {
      const ownerRequest = {
        user: {
          id: 1,
          role: RoleType.OWNER,
          organizationId: 1,
        },
      };

      it('should allow Owner to create Owner in same org', async () => {
        const createUserDto = {
          email: 'owner@test.com',
          password: 'password',
          firstName: 'New',
          lastName: 'Owner',
          organizationId: 1,
          roleType: RoleType.OWNER,
        };

        mockUserService.createUserWithRole.mockResolvedValue(mockUser);

        const result = await controller.createUser(createUserDto, ownerRequest);

        expect(result.success).toBe(true);
        expect(userService.createUserWithRole).toHaveBeenCalledWith(
          {
            email: createUserDto.email,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            organizationId: createUserDto.organizationId,
          },
          RoleType.OWNER
        );
      });

      it('should allow Owner to create Admin in same org', async () => {
        const createUserDto = {
          email: 'admin@test.com',
          password: 'password',
          firstName: 'New',
          lastName: 'Admin',
          organizationId: 1,
          roleType: RoleType.ADMIN,
        };

        mockUserService.createUserWithRole.mockResolvedValue(mockUser);

        const result = await controller.createUser(createUserDto, ownerRequest);

        expect(result.success).toBe(true);
        expect(userService.createUserWithRole).toHaveBeenCalledWith(
          {
            email: createUserDto.email,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            organizationId: createUserDto.organizationId,
          },
          RoleType.ADMIN
        );
      });

      it('should allow Owner to create Admin in child org', async () => {
        const createUserDto = {
          email: 'childadmin@test.com',
          password: 'password',
          firstName: 'Child',
          lastName: 'Admin',
          organizationId: 2,
          roleType: RoleType.ADMIN,
        };

        mockOrganizationService.isChildOrganization.mockResolvedValue(true);
        mockUserService.createUserWithRole.mockResolvedValue(mockUser);

        const result = await controller.createUser(createUserDto, ownerRequest);

        expect(result.success).toBe(true);
        expect(organizationService.isChildOrganization).toHaveBeenCalledWith(1, 2);
        expect(userService.createUserWithRole).toHaveBeenCalledWith(
          {
            email: createUserDto.email,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            organizationId: createUserDto.organizationId,
          },
          RoleType.ADMIN
        );
      });

      it('should NOT allow Owner to create Owner in child org', async () => {
        const createUserDto = {
          email: 'childowner@test.com',
          password: 'password',
          firstName: 'Child',
          lastName: 'Owner',
          organizationId: 2,
          roleType: RoleType.OWNER,
        };

        mockOrganizationService.isChildOrganization.mockResolvedValue(true);

        const result = await controller.createUser(createUserDto, ownerRequest);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Cannot create Owner in child organization');
        expect(userService.createUserWithRole).not.toHaveBeenCalled();
      });

      it('should NOT allow Owner to create user in unrelated org', async () => {
        const createUserDto = {
          email: 'unrelated@test.com',
          password: 'password',
          firstName: 'Unrelated',
          lastName: 'User',
          organizationId: 3,
          roleType: RoleType.VIEWER,
        };

        mockOrganizationService.isChildOrganization.mockResolvedValue(false);

        const result = await controller.createUser(createUserDto, ownerRequest);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Cannot create users in unrelated organizations');
        expect(userService.createUserWithRole).not.toHaveBeenCalled();
      });
    });

    describe('Admin permissions', () => {
      const adminRequest = {
        user: {
          id: 2,
          role: RoleType.ADMIN,
          organizationId: 1,
        },
      };

      it('should allow Admin to create Admin in same org', async () => {
        const createUserDto = {
          email: 'admin2@test.com',
          password: 'password',
          firstName: 'Another',
          lastName: 'Admin',
          organizationId: 1,
          roleType: RoleType.ADMIN,
        };

        mockUserService.createUserWithRole.mockResolvedValue(mockUser);

        const result = await controller.createUser(createUserDto, adminRequest);

        expect(result.success).toBe(true);
        expect(userService.createUserWithRole).toHaveBeenCalledWith(
          {
            email: createUserDto.email,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            organizationId: createUserDto.organizationId,
          },
          RoleType.ADMIN
        );
      });

      it('should allow Admin to create Viewer in same org', async () => {
        const createUserDto = {
          email: 'viewer@test.com',
          password: 'password',
          firstName: 'New',
          lastName: 'Viewer',
          organizationId: 1,
          roleType: RoleType.VIEWER,
        };

        mockUserService.createUserWithRole.mockResolvedValue(mockUser);

        const result = await controller.createUser(createUserDto, adminRequest);

        expect(result.success).toBe(true);
        expect(userService.createUserWithRole).toHaveBeenCalledWith(
          {
            email: createUserDto.email,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            organizationId: createUserDto.organizationId,
          },
          RoleType.VIEWER
        );
      });

      it('should allow parent Admin to create Admin in child org', async () => {
        const createUserDto = {
          email: 'childadmin@test.com',
          password: 'password',
          firstName: 'Child',
          lastName: 'Admin',
          organizationId: 2,
          roleType: RoleType.ADMIN,
        };

        mockOrganizationService.isChildOrganization.mockResolvedValue(true);
        mockUserService.createUserWithRole.mockResolvedValue(mockUser);

        const result = await controller.createUser(createUserDto, adminRequest);

        expect(result.success).toBe(true);
        expect(organizationService.isChildOrganization).toHaveBeenCalledWith(1, 2);
        expect(userService.createUserWithRole).toHaveBeenCalledWith(
          {
            email: createUserDto.email,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            organizationId: createUserDto.organizationId,
          },
          RoleType.ADMIN
        );
      });

      it('should NOT allow Admin to create Owner anywhere', async () => {
        const createUserDto = {
          email: 'owner@test.com',
          password: 'password',
          firstName: 'New',
          lastName: 'Owner',
          organizationId: 1,
          roleType: RoleType.OWNER,
        };

        const result = await controller.createUser(createUserDto, adminRequest);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Admins cannot create Owner users');
        expect(userService.createUserWithRole).not.toHaveBeenCalled();
      });

      it('should NOT allow Admin to create user in unrelated org', async () => {
        const createUserDto = {
          email: 'unrelated@test.com',
          password: 'password',
          firstName: 'Unrelated',
          lastName: 'User',
          organizationId: 3,
          roleType: RoleType.VIEWER,
        };

        mockOrganizationService.isChildOrganization.mockResolvedValue(false);

        const result = await controller.createUser(createUserDto, adminRequest);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Cannot create users in unrelated organizations');
        expect(userService.createUserWithRole).not.toHaveBeenCalled();
      });
    });

    describe('Viewer permissions', () => {
      const viewerRequest = {
        user: {
          id: 3,
          role: RoleType.VIEWER,
          organizationId: 1,
        },
      };

      it('should NOT allow Viewer to create any user', async () => {
        const createUserDto = {
          email: 'newuser@test.com',
          password: 'password',
          firstName: 'New',
          lastName: 'User',
          organizationId: 1,
          roleType: RoleType.VIEWER,
        };

        const result = await controller.createUser(createUserDto, viewerRequest);

        expect(result.success).toBe(false);
        expect(result.message).toContain('Viewers cannot create users');
        expect(userService.createUserWithRole).not.toHaveBeenCalled();
      });
    });

    describe('Default role assignment', () => {
      const ownerRequest = {
        user: {
          id: 1,
          role: RoleType.OWNER,
          organizationId: 1,
        },
      };

      it('should default to VIEWER role if roleType not specified', async () => {
        const createUserDto = {
          email: 'defaultuser@test.com',
          password: 'password',
          firstName: 'Default',
          lastName: 'User',
          organizationId: 1,
          // roleType not specified
        };

        mockUserService.createUserWithRole.mockResolvedValue(mockUser);

        const result = await controller.createUser(createUserDto, ownerRequest);

        expect(result.success).toBe(true);
        // The controller uses RoleType.VIEWER as default when not specified
        expect(userService.createUserWithRole).toHaveBeenCalledWith(
          {
            email: createUserDto.email,
            password: createUserDto.password,
            firstName: createUserDto.firstName,
            lastName: createUserDto.lastName,
            organizationId: createUserDto.organizationId,
          },
          RoleType.VIEWER
        );
      });
    });

    describe('Role decorator enforcement', () => {
      it('should have @Roles decorator on createUser method', () => {
        const createUserMetadata = Reflect.getMetadata('roles', controller.createUser);
        expect(createUserMetadata).toBeDefined();
        expect(createUserMetadata).toContain(RoleType.SYSTEM_ADMIN);
        expect(createUserMetadata).toContain(RoleType.OWNER);
        expect(createUserMetadata).toContain(RoleType.ADMIN);
      });

      it('should NOT include VIEWER role in @Roles decorator', () => {
        const createUserMetadata = Reflect.getMetadata('roles', controller.createUser);
        expect(createUserMetadata).toBeDefined();
        expect(createUserMetadata).not.toContain(RoleType.VIEWER);
      });
    });
  });
});
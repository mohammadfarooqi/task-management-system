import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { OrganizationService } from './organization.service';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;
  let organizationService: OrganizationService;

  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    category: 'development',
    dueDate: null,
    createdBy: 1,
    assignedTo: 2,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockTaskRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  const mockOrganizationService = {
    getOrganizationHierarchyIds: jest.fn(),
    canAccessOrganization: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: OrganizationService,
          useValue: mockOrganizationService,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
    organizationService = module.get<OrganizationService>(OrganizationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task when user is Admin', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        priority: 'high',
        category: 'development',
      };

      const userId = 1;
      const organizationId = 1;
      const userRoles = ['Admin'];

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(
        createTaskDto,
        userId,
        organizationId,
        userRoles
      );

      expect(taskRepository.create).toHaveBeenCalledWith({
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        category: createTaskDto.category,
        dueDate: undefined,
        assignedTo: undefined,
        createdBy: userId,
        organizationId,
      });
      expect(result).toEqual(mockTask);
    });

    it('should create a task when user is Owner', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
        priority: 'high',
        category: 'development',
      };

      const userId = 1;
      const organizationId = 1;
      const userRoles = ['Owner'];

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(
        createTaskDto,
        userId,
        organizationId,
        userRoles
      );

      expect(result).toEqual(mockTask);
    });

    it('should throw ForbiddenException when user has no roles', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
      };

      await expect(
        service.create(createTaskDto, 1, 1, [])
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user is Viewer', async () => {
      const createTaskDto = {
        title: 'New Task',
        description: 'New Description',
      };

      await expect(
        service.create(createTaskDto, 1, 1, ['Viewer'])
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('should return all tasks for Admin/Owner', async () => {
      const userId = 1;
      const organizationId = 1;
      const userRoles = ['Admin'];
      const tasks = [mockTask];

      mockOrganizationService.getOrganizationHierarchyIds.mockResolvedValue([1]);
      mockQueryBuilder.getMany.mockResolvedValue(tasks);

      const result = await service.findAll(userId, organizationId, userRoles);

      expect(organizationService.getOrganizationHierarchyIds).toHaveBeenCalledWith(
        organizationId
      );
      expect(result).toEqual(tasks);
    });

    it('should return only assigned/created tasks for Viewer', async () => {
      const userId = 3;
      const organizationId = 1;
      const userRoles = ['Viewer'];
      const tasks = [{ ...mockTask, assignedTo: userId }];

      mockOrganizationService.getOrganizationHierarchyIds.mockResolvedValue([1]);
      mockQueryBuilder.getMany.mockResolvedValue(tasks);

      const result = await service.findAll(userId, organizationId, userRoles);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(task.createdBy = :userId OR task.assignedTo = :userId)',
        { userId }
      );
      expect(result).toEqual(tasks);
    });

    it('should handle organization hierarchy', async () => {
      const userId = 1;
      const organizationId = 1;
      const userRoles = ['Admin'];
      const orgIds = [1, 2]; // Parent and child org

      mockOrganizationService.getOrganizationHierarchyIds.mockResolvedValue(orgIds);
      mockQueryBuilder.getMany.mockResolvedValue([mockTask]);

      await service.findAll(userId, organizationId, userRoles);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'task.organizationId IN (:...orgIds)',
        { orgIds }
      );
    });
  });

  describe('findOne', () => {
    it('should return task when user has access', async () => {
      const taskId = 1;
      const userId = 1;
      const organizationId = 1;
      const userRoles = ['Admin'];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);

      const result = await service.findOne(taskId, userId, organizationId, userRoles);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(999, 1, 1, ['Admin'])
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot access task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(false);

      await expect(
        service.findOne(1, 3, 2, ['Viewer'])
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('replace', () => {
    it('should replace task when user created it', async () => {
      const taskId = 1;
      const userId = 1;
      const organizationId = 1;
      const userRoles = ['Admin'];
      const replaceDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'in-progress',
        priority: 'high',
        category: 'development',
      };

      const taskByCreator = { ...mockTask, createdBy: userId };
      mockTaskRepository.findOne.mockResolvedValue(taskByCreator);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.replace(taskId, replaceDto, userId, organizationId, userRoles);

      expect(taskRepository.update).toHaveBeenCalledWith(taskId, {
        title: replaceDto.title,
        description: replaceDto.description,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        category: replaceDto.category,
        dueDate: undefined,
        assignedTo: undefined,
      });
    });

    it('should allow parent org Admin to replace child org task', async () => {
      const taskId = 1;
      const userId = 2;
      const parentOrgId = 1;
      const childOrgId = 2;
      const userRoles = ['Admin'];
      const replaceDto = {
        title: 'Updated by Parent Admin',
        description: 'Updated Description',
        status: 'completed',
        priority: 'low',
        category: 'general',
      };

      const childOrgTask = { ...mockTask, organizationId: childOrgId, createdBy: 3 };
      mockTaskRepository.findOne.mockResolvedValue(childOrgTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.replace(taskId, replaceDto, userId, parentOrgId, userRoles);

      expect(taskRepository.update).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when Viewer tries to replace', async () => {
      const replaceDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'in-progress',
        priority: 'high',
        category: 'development',
      };

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);

      await expect(
        service.replace(1, replaceDto, 3, 1, ['Viewer'])
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove task when user created it', async () => {
      const taskId = 1;
      const userId = 1;
      const organizationId = 1;
      const userRoles = ['Admin'];

      const taskByCreator = { ...mockTask, createdBy: userId };
      mockTaskRepository.findOne.mockResolvedValue(taskByCreator);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.remove.mockResolvedValue(taskByCreator);

      await service.remove(taskId, userId, organizationId, userRoles);

      expect(taskRepository.remove).toHaveBeenCalledWith(taskByCreator);
    });

    it('should allow parent org Admin to delete child org task', async () => {
      const taskId = 1;
      const userId = 2;
      const parentOrgId = 1;
      const childOrgId = 2;
      const userRoles = ['Admin'];

      const childOrgTask = { ...mockTask, organizationId: childOrgId, createdBy: 3 };
      mockTaskRepository.findOne.mockResolvedValue(childOrgTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.remove.mockResolvedValue(childOrgTask);

      await service.remove(taskId, userId, parentOrgId, userRoles);

      expect(taskRepository.remove).toHaveBeenCalledWith(childOrgTask);
    });

    it('should throw ForbiddenException when user cannot delete task', async () => {
      const taskId = 1;
      const userId = 3;
      const organizationId = 1;
      const userRoles = ['Viewer'];

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);

      await expect(
        service.remove(taskId, userId, organizationId, userRoles)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TaskService } from './task.service';
import { OrganizationService } from './organization.service';
import { Task } from '../entities/task.entity';
import { TaskStatus, TaskPriority, TaskCategory } from '@task-management-system/data';

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
    category: TaskCategory.WORK,
    dueDate: null,
    createdBy: 1,
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
        category: TaskCategory.WORK,
      };

      const userId = 1;
      const organizationId = 1;
      const userRole = 'Admin';

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(
        createTaskDto,
        userId,
        organizationId,
        userRole
      );

      expect(taskRepository.create).toHaveBeenCalledWith({
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: TaskStatus.PENDING,
        priority: TaskPriority.HIGH,
        category: createTaskDto.category,
        dueDate: undefined,
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
        category: TaskCategory.WORK,
      };

      const userId = 1;
      const organizationId = 1;
      const userRole = 'Owner';

      mockTaskRepository.create.mockReturnValue(mockTask);
      mockTaskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(
        createTaskDto,
        userId,
        organizationId,
        userRole
      );

      expect(result).toEqual(mockTask);
    });

  });

  describe('findAll', () => {
    it('should return all tasks for Admin/Owner', async () => {
      const userId = 1;
      const organizationId = 1;
      const userRole = 'Admin';
      const tasks = [mockTask];

      mockOrganizationService.getOrganizationHierarchyIds.mockResolvedValue([1]);
      mockQueryBuilder.getMany.mockResolvedValue(tasks);

      const result = await service.findAll(userId, organizationId, userRole);

      expect(organizationService.getOrganizationHierarchyIds).toHaveBeenCalledWith(
        organizationId
      );
      expect(result).toEqual(tasks);
    });

    it('should return all organization tasks for Viewer', async () => {
      const userId = 3;
      const organizationId = 1;
      const userRole = 'Viewer';
      const tasks = [{ ...mockTask, createdBy: 1 }, { ...mockTask, createdBy: 2 }]; // Tasks from different users

      mockOrganizationService.getOrganizationHierarchyIds.mockResolvedValue([1]);
      mockQueryBuilder.getMany.mockResolvedValue(tasks);

      const result = await service.findAll(userId, organizationId, userRole);

      // Viewer should now see all tasks, so andWhere should NOT be called with userId filter
      expect(mockQueryBuilder.andWhere).not.toHaveBeenCalledWith(
        'task.createdBy = :userId',
        { userId }
      );
      expect(result).toEqual(tasks);
    });

    it('should handle organization hierarchy', async () => {
      const userId = 1;
      const organizationId = 1;
      const userRole = 'Admin';
      const orgIds = [1, 2]; // Parent and child org

      mockOrganizationService.getOrganizationHierarchyIds.mockResolvedValue(orgIds);
      mockQueryBuilder.getMany.mockResolvedValue([mockTask]);

      await service.findAll(userId, organizationId, userRole);

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
      const userRole = 'Admin';

      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);

      const result = await service.findOne(taskId, userId, organizationId, userRole);

      expect(result).toEqual(mockTask);
    });

    it('should throw NotFoundException when task not found', async () => {
      mockTaskRepository.findOne.mockResolvedValue(null);

      await expect(
        service.findOne(999, 1, 1, 'Admin')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user cannot access task', async () => {
      mockTaskRepository.findOne.mockResolvedValue(mockTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(false);

      await expect(
        service.findOne(1, 3, 2, 'Viewer')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('replace', () => {
    it('should replace task when Admin (even if not creator)', async () => {
      const taskId = 1;
      const userId = 1;
      const organizationId = 1;
      const userRole = 'Admin';
      const replaceDto = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: 'in-progress',
        priority: 'high',
        category: TaskCategory.WORK,
      };

      const taskByOtherUser = { ...mockTask, createdBy: 999 }; // Different creator
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.replace(taskId, replaceDto, userId, organizationId, userRole);

      expect(taskRepository.update).toHaveBeenCalledWith(taskId, {
        title: replaceDto.title,
        description: replaceDto.description,
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        category: replaceDto.category,
        dueDate: undefined,
      });
    });

    it('should allow parent org Admin to replace child org task', async () => {
      const taskId = 1;
      const userId = 2;
      const parentOrgId = 1;
      const childOrgId = 2;
      const userRole = 'Admin';
      const replaceDto = {
        title: 'Updated by Parent Admin',
        description: 'Updated Description',
        status: 'completed',
        priority: 'low',
        category: 'work',
      };

      const childOrgTask = { ...mockTask, organizationId: childOrgId, createdBy: 3 };
      mockTaskRepository.findOne.mockResolvedValue(childOrgTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.replace(taskId, replaceDto, userId, parentOrgId, userRole);

      expect(taskRepository.update).toHaveBeenCalled();
    });

    it('should allow Owner to replace any task', async () => {
      const taskId = 1;
      const userId = 1;
      const organizationId = 1;
      const userRole = 'Owner';
      const replaceDto = {
        title: 'Updated by Owner',
        description: 'Owner can update any task',
        status: 'completed',
        priority: 'low',
        category: 'management',
      };

      const taskByOtherUser = { ...mockTask, createdBy: 999 };
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.update.mockResolvedValue({ affected: 1 });

      await service.replace(taskId, replaceDto, userId, organizationId, userRole);

      expect(taskRepository.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove task when Admin (even if not creator)', async () => {
      const taskId = 1;
      const userId = 1;
      const organizationId = 1;
      const userRole = 'Admin';

      const taskByOtherUser = { ...mockTask, createdBy: 999 }; // Different creator
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.remove.mockResolvedValue(taskByOtherUser);

      await service.remove(taskId, userId, organizationId, userRole);

      expect(taskRepository.remove).toHaveBeenCalledWith(taskByOtherUser);
    });

    it('should allow parent org Admin to delete child org task', async () => {
      const taskId = 1;
      const userId = 2;
      const parentOrgId = 1;
      const childOrgId = 2;
      const userRole = 'Admin';

      const childOrgTask = { ...mockTask, organizationId: childOrgId, createdBy: 3 };
      mockTaskRepository.findOne.mockResolvedValue(childOrgTask);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.remove.mockResolvedValue(childOrgTask);

      await service.remove(taskId, userId, parentOrgId, userRole);

      expect(taskRepository.remove).toHaveBeenCalledWith(childOrgTask);
    });

    it('should allow Owner to remove any task', async () => {
      const taskId = 1;
      const userId = 1;
      const organizationId = 1;
      const userRole = 'Owner';

      const taskByOtherUser = { ...mockTask, createdBy: 999 };
      mockTaskRepository.findOne.mockResolvedValue(taskByOtherUser);
      mockOrganizationService.canAccessOrganization.mockResolvedValue(true);
      mockTaskRepository.remove.mockResolvedValue(taskByOtherUser);

      await service.remove(taskId, userId, organizationId, userRole);

      expect(taskRepository.remove).toHaveBeenCalledWith(taskByOtherUser);
    });
  });
});
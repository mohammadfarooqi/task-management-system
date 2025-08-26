import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from '../services/task.service';
import { AuditService } from '../services/audit.service';
import { RoleType, TaskStatus, TaskPriority, TaskCategory } from '@task-management-system/data';

describe('TaskController', () => {
  let controller: TaskController;
  let taskService: TaskService;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const createMockRequest = (userData: { id: number; role: string; organizationId: number }) => ({
    user: {
      sub: userData.id,  // JWT uses 'sub' for user ID
      role: userData.role,
      organizationId: userData.organizationId,
    },
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0'),
  });

  const mockTask = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.PENDING,
    priority: TaskPriority.MEDIUM,
    category: TaskCategory.WORK,
    dueDate: new Date('2024-12-31'),
    createdBy: 1,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
        {
          provide: AuditService,
          useValue: mockAuditService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createTaskDto = {
      title: 'New Task',
      description: 'New Description',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      category: TaskCategory.OTHER,
      dueDate: new Date('2024-12-31'),
    };

    it('should create a task for Admin user', async () => {
      const req = createMockRequest({
        id: 1,
        role: RoleType.ADMIN,
        organizationId: 1,
      });

      mockTaskService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(taskService.create).toHaveBeenCalledWith(
        createTaskDto,
        1,
        1,
        RoleType.ADMIN
      );
    });

    it('should create a task for Owner user', async () => {
      const req = createMockRequest({
        id: 2,
        role: RoleType.OWNER,
        organizationId: 1,
      });

      mockTaskService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(taskService.create).toHaveBeenCalledWith(
        createTaskDto,
        2,
        1,
        RoleType.OWNER
      );
    });

    it('should create a task for SystemAdmin user', async () => {
      const req = createMockRequest({
        id: 3,
        role: RoleType.SYSTEM_ADMIN,
        organizationId: 1,
      });

      mockTaskService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(taskService.create).toHaveBeenCalledWith(
        createTaskDto,
        3,
        1,
        RoleType.SYSTEM_ADMIN
      );
    });
  });

  describe('findAll', () => {
    it('should return all tasks for authenticated user', async () => {
      const req = createMockRequest({
        id: 1,
        role: RoleType.VIEWER,
        organizationId: 1,
      });

      const mockTasks = [mockTask];
      mockTaskService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll(req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
      expect(taskService.findAll).toHaveBeenCalledWith(1, 1, RoleType.VIEWER);
    });

    it('should apply role-based filtering in service layer', async () => {
      const req = createMockRequest({
        id: 1,
        role: RoleType.ADMIN,
        organizationId: 1,
      });

      const mockTasks = [mockTask, { ...mockTask, id: 2, createdBy: 2 }];
      mockTaskService.findAll.mockResolvedValue(mockTasks);

      const result = await controller.findAll(req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTasks);
      expect(taskService.findAll).toHaveBeenCalledWith(1, 1, RoleType.ADMIN);
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      const req = createMockRequest({
        id: 1,
        role: RoleType.VIEWER,
        organizationId: 1,
      });

      mockTaskService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne(1, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockTask);
      expect(taskService.findOne).toHaveBeenCalledWith(1, 1, 1, RoleType.VIEWER);
    });

    it('should handle task not found', async () => {
      const req = createMockRequest({
        id: 1,
        role: RoleType.ADMIN,
        organizationId: 1,
      });

      mockTaskService.findOne.mockRejectedValue(new Error('Task not found'));

      await expect(controller.findOne(999, req)).rejects.toThrow('Task not found');
    });
  });

  describe('replace', () => {
    const replaceTaskDto = {
      title: 'Updated Task',
      description: 'Updated Description',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      category: TaskCategory.OTHER,
      dueDate: new Date('2024-12-31'),
    };

    it('should replace a task for Admin user', async () => {
      const req = createMockRequest({
        id: 1,
        role: RoleType.ADMIN,
        organizationId: 1,
      });

      const updatedTask = { ...mockTask, ...replaceTaskDto };
      mockTaskService.replace.mockResolvedValue(updatedTask);

      const result = await controller.replace(1, replaceTaskDto, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedTask);
      expect(taskService.replace).toHaveBeenCalledWith(
        1,
        replaceTaskDto,
        1,
        1,
        RoleType.ADMIN
      );
    });

    it('should replace a task for Owner user', async () => {
      const req = createMockRequest({
        id: 2,
        role: RoleType.OWNER,
        organizationId: 1,
      });

      const updatedTask = { ...mockTask, ...replaceTaskDto };
      mockTaskService.replace.mockResolvedValue(updatedTask);

      const result = await controller.replace(1, replaceTaskDto, req);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(updatedTask);
      expect(taskService.replace).toHaveBeenCalledWith(
        1,
        replaceTaskDto,
        2,
        1,
        RoleType.OWNER
      );
    });
  });

  describe('remove', () => {
    it('should remove a task for Admin user', async () => {
      const req = createMockRequest({
        id: 1,
        role: RoleType.ADMIN,
        organizationId: 1,
      });

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, req);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Task deleted successfully');
      expect(taskService.remove).toHaveBeenCalledWith(1, 1, 1, RoleType.ADMIN);
    });

    it('should remove a task for Owner user', async () => {
      const req = createMockRequest({
        id: 2,
        role: RoleType.OWNER,
        organizationId: 1,
      });

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, req);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Task deleted successfully');
      expect(taskService.remove).toHaveBeenCalledWith(1, 2, 1, RoleType.OWNER);
    });

    it('should remove a task for SystemAdmin user', async () => {
      const req = createMockRequest({
        id: 3,
        role: RoleType.SYSTEM_ADMIN,
        organizationId: 1,
      });

      mockTaskService.findOne.mockResolvedValue(mockTask);
      mockTaskService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(1, req);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Task deleted successfully');
      expect(taskService.remove).toHaveBeenCalledWith(1, 3, 1, RoleType.SYSTEM_ADMIN);
    });
  });

  describe('Role decorator enforcement', () => {
    it('should have @Roles decorator on create method', () => {
      const createMetadata = Reflect.getMetadata('roles', controller.create);
      expect(createMetadata).toBeDefined();
      expect(createMetadata).toContain(RoleType.ADMIN);
      expect(createMetadata).toContain(RoleType.OWNER);
      expect(createMetadata).toContain(RoleType.SYSTEM_ADMIN);
    });

    it('should have @Roles decorator on replace method', () => {
      const replaceMetadata = Reflect.getMetadata('roles', controller.replace);
      expect(replaceMetadata).toBeDefined();
      expect(replaceMetadata).toContain(RoleType.ADMIN);
      expect(replaceMetadata).toContain(RoleType.OWNER);
      expect(replaceMetadata).toContain(RoleType.SYSTEM_ADMIN);
    });

    it('should have @Roles decorator on remove method', () => {
      const removeMetadata = Reflect.getMetadata('roles', controller.remove);
      expect(removeMetadata).toBeDefined();
      expect(removeMetadata).toContain(RoleType.ADMIN);
      expect(removeMetadata).toContain(RoleType.OWNER);
      expect(removeMetadata).toContain(RoleType.SYSTEM_ADMIN);
    });

    it('should NOT have @Roles decorator on findAll method', () => {
      const findAllMetadata = Reflect.getMetadata('roles', controller.findAll);
      expect(findAllMetadata).toBeUndefined();
    });

    it('should NOT have @Roles decorator on findOne method', () => {
      const findOneMetadata = Reflect.getMetadata('roles', controller.findOne);
      expect(findOneMetadata).toBeUndefined();
    });
  });
});
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '../entities/task.entity';

// Simple DTOs for tasks
export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  category?: string;
  dueDate?: Date;
  assignedTo?: number;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  dueDate?: Date;
  assignedTo?: number;
}

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: number, organizationId: number, userRoles: string[]): Promise<Task> {
    // Add role validation to create method
    if (!userRoles || userRoles.length === 0) {
      throw new ForbiddenException('No roles assigned - contact administrator');
    }

    // Only Admin and Owner can create tasks
    if (!userRoles.includes('Owner') && !userRoles.includes('Admin')) {
      throw new ForbiddenException('Only Admins and Owners can create tasks');
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      createdBy: userId,
      organizationId,
    });

    return this.taskRepository.save(task);
  }

  async findAll(userId: number, organizationId: number, userRoles: string[]): Promise<Task[]> {
    // Validate user has roles assigned
    if (!userRoles || userRoles.length === 0) {
      throw new ForbiddenException('No roles assigned - contact administrator');
    }

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where('task.organizationId = :organizationId', { organizationId });

    // role-based filtering
    if (!userRoles.includes('Owner') && !userRoles.includes('Admin')) {
      // Viewers can only see tasks they created or are assigned to
      queryBuilder.andWhere(
        '(task.createdBy = :userId OR task.assignedTo = :userId)',
        { userId }
      );
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number, userId: number, organizationId: number, userRoles: string[]): Promise<Task> {
    // Validate user has roles assigned
    if (!userRoles || userRoles.length === 0) {
      throw new ForbiddenException('No roles assigned - contact administrator');
    }

    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['creator', 'assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user can access this task
    const canAccess =
      task.organizationId === organizationId && // Same org
      (userRoles.includes('Owner') ||
       userRoles.includes('Admin') ||
       task.createdBy === userId ||
       task.assignedTo === userId);

    if (!canAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    return task;
  }

  async update(id: number, updateTaskDto: UpdateTaskDto, userId: number, organizationId: number, userRoles: string[]): Promise<Task> {
    const task = await this.findOne(id, userId, organizationId, userRoles);

    // Check if user can update this task
    const canUpdate = userRoles.includes('Owner') ||
                     userRoles.includes('Admin') ||
                     task.createdBy === userId;

    if (!canUpdate) {
      throw new ForbiddenException('You can only update tasks you created');
    }

    await this.taskRepository.update(id, updateTaskDto);
    return this.findOne(id, userId, organizationId, userRoles);
  }

  async remove(id: number, userId: number, organizationId: number, userRoles: string[]): Promise<void> {
    const task = await this.findOne(id, userId, organizationId, userRoles);

    // Check if user can delete this task
    const canDelete = userRoles.includes('Owner') ||
                     userRoles.includes('Admin') ||
                     task.createdBy === userId;

    if (!canDelete) {
      throw new ForbiddenException('You can only delete tasks you created');
    }

    await this.taskRepository.remove(task);
  }
}
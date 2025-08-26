import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TaskStatus, TaskPriority, TaskCategory } from '@task-management-system/data';
import { CreateTaskDto, ReplaceTaskDto, hasRolePermission, canViewAllOrgTasks, canEditSpecificTask, RoleType } from '@task-management-system/data';
import { OrganizationService } from './organization.service';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    private organizationService: OrganizationService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: number, organizationId: number, userRole: string): Promise<Task> {
    // Only Admin, Owner, and SystemAdmin can reach this method

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: (createTaskDto.status as TaskStatus) || TaskStatus.PENDING,
      priority: (createTaskDto.priority as TaskPriority) || TaskPriority.MEDIUM,
      category: createTaskDto.category as TaskCategory,
      dueDate: createTaskDto.dueDate,
      createdBy: userId,
      organizationId,
    });

    return this.taskRepository.save(task);
  }

  async findAll(userId: number, organizationId: number, userRole: string): Promise<Task[]> {
    // All authenticated users can view tasks, but filtering depends on role

    // Get organization hierarchy (parent + children orgs)
    const orgIds = await this.organizationService.getOrganizationHierarchyIds(organizationId);

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator');

    // Include tasks from all organizations in the hierarchy
    if (orgIds.length > 1) {
      queryBuilder.where('task.organizationId IN (:...orgIds)', { orgIds });
    } else {
      queryBuilder.where('task.organizationId = :organizationId', { organizationId });
    }

    // role-based filtering
    if (!canViewAllOrgTasks(userRole)) {
      // Viewers can only see tasks they created
      queryBuilder.andWhere(
        'task.createdBy = :userId',
        { userId }
      );
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number, userId: number, organizationId: number, userRole: string): Promise<Task> {

    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['creator'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user's organization can access this task (includes parent/child org access)
    const canAccessOrg = await this.organizationService.canAccessOrganization(
      organizationId,
      task.organizationId
    );

    // Check if user can access this task
    const canAccess =
      canAccessOrg && // User's org has access to task's org
      (canViewAllOrgTasks(userRole) ||
       task.createdBy === userId);

    if (!canAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    return task;
  }

  async replace(id: number, replaceTaskDto: ReplaceTaskDto, userId: number, organizationId: number, userRole: string): Promise<Task> {
    // only Admin/Owner/SystemAdmin can reach this
    const task = await this.findOne(id, userId, organizationId, userRole);


    // Full replacement - update all fields
    await this.taskRepository.update(id, {
      title: replaceTaskDto.title,
      description: replaceTaskDto.description,
      status: replaceTaskDto.status as TaskStatus,
      priority: replaceTaskDto.priority as TaskPriority,
      category: replaceTaskDto.category as TaskCategory,
      dueDate: replaceTaskDto.dueDate,
    });

    return this.findOne(id, userId, organizationId, userRole);
  }

  async remove(id: number, userId: number, organizationId: number, userRole: string): Promise<void> {
    // only Admin/Owner/SystemAdmin can reach this
    const task = await this.findOne(id, userId, organizationId, userRole);


    await this.taskRepository.remove(task);
  }
}
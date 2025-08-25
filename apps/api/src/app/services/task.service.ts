import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../entities/task.entity';
import { TaskStatus, TaskPriority } from '@task-management-system/data';
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
    // Add role validation to create method
    if (!userRole) {
      throw new ForbiddenException('No role assigned - contact administrator');
    }

    // Only Admin and Owner can create tasks
    if (!hasRolePermission(userRole, RoleType.ADMIN)) {
      throw new ForbiddenException('Only Admins and Owners can create tasks');
    }

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      status: (createTaskDto.status as TaskStatus) || TaskStatus.PENDING,
      priority: (createTaskDto.priority as TaskPriority) || TaskPriority.MEDIUM,
      category: createTaskDto.category,
      dueDate: createTaskDto.dueDate,
      assignedTo: createTaskDto.assignedTo,
      createdBy: userId,
      organizationId,
    });

    return this.taskRepository.save(task);
  }

  async findAll(userId: number, organizationId: number, userRole: string): Promise<Task[]> {
    // Validate user has role assigned
    if (!userRole) {
      throw new ForbiddenException('No role assigned - contact administrator');
    }

    // Get organization hierarchy (parent + children orgs)
    const orgIds = await this.organizationService.getOrganizationHierarchyIds(organizationId);

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee');

    // Include tasks from all organizations in the hierarchy
    if (orgIds.length > 1) {
      queryBuilder.where('task.organizationId IN (:...orgIds)', { orgIds });
    } else {
      queryBuilder.where('task.organizationId = :organizationId', { organizationId });
    }

    // role-based filtering
    if (!canViewAllOrgTasks(userRole)) {
      // Viewers can only see tasks they created or are assigned to
      queryBuilder.andWhere(
        '(task.createdBy = :userId OR task.assignedTo = :userId)',
        { userId }
      );
    }

    return queryBuilder.getMany();
  }

  async findOne(id: number, userId: number, organizationId: number, userRole: string): Promise<Task> {
    // Validate user has role assigned
    if (!userRole) {
      throw new ForbiddenException('No role assigned - contact administrator');
    }

    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['creator', 'assignee'],
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
       task.createdBy === userId ||
       task.assignedTo === userId);

    if (!canAccess) {
      throw new ForbiddenException('Access denied to this task');
    }

    return task;
  }

  async replace(id: number, replaceTaskDto: ReplaceTaskDto, userId: number, organizationId: number, userRole: string): Promise<Task> {
    const task = await this.findOne(id, userId, organizationId, userRole);

    // Check if user can replace this task
    // Parent org Owner/Admin can manage child org tasks
    const isParentOrgManager = organizationId !== task.organizationId &&
      hasRolePermission(userRole, RoleType.ADMIN);

    const canReplace = isParentOrgManager || canEditSpecificTask(userRole, task.createdBy, userId);

    if (!canReplace) {
      throw new ForbiddenException('You can only replace tasks you created or manage as parent org admin');
    }

    // Full replacement - update all fields
    await this.taskRepository.update(id, {
      title: replaceTaskDto.title,
      description: replaceTaskDto.description,
      status: replaceTaskDto.status as TaskStatus,
      priority: replaceTaskDto.priority as TaskPriority,
      category: replaceTaskDto.category,
      dueDate: replaceTaskDto.dueDate,
      assignedTo: replaceTaskDto.assignedTo
    });

    return this.findOne(id, userId, organizationId, userRole);
  }

  async remove(id: number, userId: number, organizationId: number, userRole: string): Promise<void> {
    const task = await this.findOne(id, userId, organizationId, userRole);

    // Check if user can delete this task
    // Parent org Owner/Admin can manage child org tasks
    const isParentOrgManager = organizationId !== task.organizationId &&
      hasRolePermission(userRole, RoleType.ADMIN);

    const canDelete = isParentOrgManager || canEditSpecificTask(userRole, task.createdBy, userId);

    if (!canDelete) {
      throw new ForbiddenException('You can only delete tasks you created or manage as parent org admin');
    }

    await this.taskRepository.remove(task);
  }
}
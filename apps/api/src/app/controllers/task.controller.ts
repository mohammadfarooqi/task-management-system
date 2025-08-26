import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Request,
  ParseIntPipe,
  UseGuards
} from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { AuditService } from '../services/audit.service';
import { CreateTaskDto, ReplaceTaskDto, RoleType } from '@task-management-system/data';
import { Roles, RolesGuard } from '@task-management-system/auth';

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly auditService: AuditService
  ) {}

  @Post()
  @Roles(RoleType.SYSTEM_ADMIN, RoleType.OWNER, RoleType.ADMIN)
  @UseGuards(RolesGuard)
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    const task = await this.taskService.create(
      createTaskDto,
      req.user.sub, // user ID from JWT
      req.user.organizationId,
      req.user.role || 'Viewer' // Single role from JWT
    );

    // log task creation
    await this.auditService.log({
      userId: req.user.sub,
      action: 'task:created',
      resourceType: 'task',
      resourceId: task.id,
      organizationId: req.user.organizationId,
      details: { title: task.title, priority: task.priority },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return {
      success: true,
      data: task,
      message: 'Task created successfully',
    };
  }

  @Get()
  async findAll(@Request() req: any) {
    const tasks = await this.taskService.findAll(
      req.user.sub,
      req.user.organizationId,
      req.user.role || 'Viewer' // Single role from JWT
    );

    // log task list access
    await this.auditService.log({
      userId: req.user.sub,
      action: 'task:list_accessed',
      resourceType: 'task',
      organizationId: req.user.organizationId,
      details: { taskCount: tasks.length },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return {
      success: true,
      data: tasks,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const task = await this.taskService.findOne(
      id,
      req.user.sub,
      req.user.organizationId,
      req.user.role || 'Viewer' // Single role from JWT
    );

    // log task access
    await this.auditService.log({
      userId: req.user.sub,
      action: 'task:viewed',
      resourceType: 'task',
      resourceId: task.id,
      organizationId: req.user.organizationId,
      details: { title: task.title },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return {
      success: true,
      data: task,
    };
  }

  @Put(':id')
  @Roles(RoleType.SYSTEM_ADMIN, RoleType.OWNER, RoleType.ADMIN)
  @UseGuards(RolesGuard)
  async replace(
    @Param('id', ParseIntPipe) id: number,
    @Body() replaceTaskDto: ReplaceTaskDto,
    @Request() req: any
  ) {
    const task = await this.taskService.replace(
      id,
      replaceTaskDto,
      req.user.sub,
      req.user.organizationId,
      req.user.role || 'Viewer' // Single role from JWT
    );

    // log task replacement
    await this.auditService.log({
      userId: req.user.sub,
      action: 'task:replaced',
      resourceType: 'task',
      resourceId: task.id,
      organizationId: req.user.organizationId,
      details: {
        title: task.title,
        fullReplacement: replaceTaskDto
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return {
      success: true,
      data: task,
      message: 'Task replaced successfully',
    };
  }

  @Delete(':id')
  @Roles(RoleType.SYSTEM_ADMIN, RoleType.OWNER, RoleType.ADMIN)
  @UseGuards(RolesGuard)
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // get task info before deletion for logging
    const task = await this.taskService.findOne(
      id,
      req.user.sub,
      req.user.organizationId,
      req.user.role || 'Viewer' // Single role from JWT
    );

    await this.taskService.remove(
      id,
      req.user.sub,
      req.user.organizationId,
      req.user.role || 'Viewer' // Single role from JWT
    );

    // log task deletion
    await this.auditService.log({
      userId: req.user.sub,
      action: 'task:deleted',
      resourceType: 'task',
      resourceId: id,
      organizationId: req.user.organizationId,
      details: { title: task.title },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }
}
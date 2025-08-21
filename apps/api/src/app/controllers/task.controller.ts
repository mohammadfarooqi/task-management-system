import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ParseIntPipe
} from '@nestjs/common';
import { TaskService } from '../services/task.service';
import { AuditService } from '../services/audit.service';
import type { CreateTaskDto, UpdateTaskDto } from '../services/task.service';

@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly auditService: AuditService
  ) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    const task = await this.taskService.create(
      createTaskDto,
      req.user.sub, // user ID from JWT
      req.user.organizationId,
      req.user.roles || []
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
      req.user.roles || []
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
      req.user.roles || []
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

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any
  ) {
    const task = await this.taskService.update(
      id,
      updateTaskDto,
      req.user.sub,
      req.user.organizationId,
      req.user.roles || []
    );

    // log task update
    await this.auditService.log({
      userId: req.user.sub,
      action: 'task:updated',
      resourceType: 'task',
      resourceId: task.id,
      organizationId: req.user.organizationId,
      details: {
        title: task.title,
        changes: updateTaskDto
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return {
      success: true,
      data: task,
      message: 'Task updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    // get task info before deletion for logging
    const task = await this.taskService.findOne(
      id,
      req.user.sub,
      req.user.organizationId,
      req.user.roles || []
    );

    await this.taskService.remove(
      id,
      req.user.sub,
      req.user.organizationId,
      req.user.roles || []
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
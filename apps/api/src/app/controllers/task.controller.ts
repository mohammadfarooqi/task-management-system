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
import type { CreateTaskDto, UpdateTaskDto } from '../services/task.service';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req: any) {
    const task = await this.taskService.create(
      createTaskDto,
      req.user.sub, // user ID from JWT
      req.user.organizationId,
      req.user.roles || []
    );

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

    return {
      success: true,
      data: task,
      message: 'Task updated successfully',
    };
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.taskService.remove(
      id,
      req.user.sub,
      req.user.organizationId,
      req.user.roles || []
    );

    return {
      success: true,
      message: 'Task deleted successfully',
    };
  }
}
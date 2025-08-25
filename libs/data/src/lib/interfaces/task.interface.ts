import { TaskStatus, TaskPriority, TaskCategory } from '../enums/task.enums';

export interface Task {
  id: number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate?: Date | string;
  createdBy: number;
  organizationId: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  creator?: any;
  organization?: any;
}
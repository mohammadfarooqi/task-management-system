import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { CreateTaskDto, Task as TaskBase } from '@task-management-system/data';

// Frontend-specific Task interface (same as in task-dashboard)
export interface Task extends Omit<TaskBase, 'createdAt' | 'updatedAt' | 'dueDate'> {
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrl: './task-form.component.scss',
})
export class TaskFormComponent implements OnInit {
  @Input() task: Task | null = null; // For edit mode
  @Output() taskSaved = new EventEmitter<void>();
  @Output() formClosed = new EventEmitter<void>();

  taskData: CreateTaskDto = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'work',
    dueDate: undefined
  };

  isEditMode = false;
  isSubmitting = false;
  errorMessage = '';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    // If task is provided, we're in edit mode
    if (this.task) {
      this.isEditMode = true;
      // Format date for HTML date input (YYYY-MM-DD)
      let formattedDate: string | undefined;
      if (this.task.dueDate) {
        // Extract just the date part without timezone conversion
        // This ensures the date shown matches what's in the database
        formattedDate = this.task.dueDate.split('T')[0];
      }
      
      this.taskData = {
        title: this.task.title,
        description: this.task.description || '',
        priority: this.task.priority as any, // Cast to handle type differences
        category: this.task.category,
        dueDate: formattedDate as any, // HTML date input expects string in YYYY-MM-DD format
        status: this.task.status as any // Include status for edit mode
      };
    }
  }

  onSubmit(): void {
    this.isSubmitting = true;
    this.errorMessage = '';

    // Clean up the data
    const submitData = { ...this.taskData };
    if (!submitData.dueDate) {
      delete submitData.dueDate;
    }

    console.log('Submitting task data:', submitData);

    if (this.isEditMode && this.task) {
      // Update existing task
      this.taskService.updateTask(this.task.id, submitData).subscribe({
        next: (response) => {
          console.log('Task updated:', response);
          this.isSubmitting = false;

          if (response.success) {
            this.taskSaved.emit();
          } else {
            this.errorMessage = response.message || 'Failed to update task';
          }
        },
        error: (error) => {
          console.error('Error updating task:', error);
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Failed to update task';
        }
      });
    } else {
      // Create new task
      this.taskService.createTask(submitData).subscribe({
        next: (response) => {
          console.log('Task created:', response);
          this.isSubmitting = false;

          if (response.success) {
            this.taskSaved.emit();
          } else {
            this.errorMessage = response.message || 'Failed to create task';
          }
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.isSubmitting = false;
          this.errorMessage = error.error?.message || 'Failed to create task';
        }
      });
    }
  }

  closeForm(): void {
    this.formClosed.emit();
  }

}
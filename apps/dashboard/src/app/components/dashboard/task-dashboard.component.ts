import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../../services/auth.service';
import { TaskService } from '../../services/task.service';
import { Task as TaskBase } from '@task-management-system/data';

// Frontend-specific Task interface where dates are always strings (from JSON)
export interface Task extends Omit<TaskBase, 'createdAt' | 'updatedAt' | 'dueDate'> {
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

@Component({
  selector: 'app-task-dashboard',
  templateUrl: './task-dashboard.component.html',
  styleUrl: './task-dashboard.component.scss',
})
export class TaskDashboardComponent implements OnInit {
  currentUser: User | null = null;
  tasks: Task[] = [];
  isLoading = true;
  errorMessage = '';
  showCreateForm = false;

  constructor(
    private authService: AuthService,
    private taskService: TaskService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get current user
    this.currentUser = this.authService.getCurrentUser();

    // If not logged in, redirect to login
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Load tasks
    this.loadTasks();
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService.getTasks().subscribe({
      next: (response) => {
        console.log('Tasks response:', response);
        this.isLoading = false;

        if (response.success && response.data) {
          // Map the response to ensure dates are strings
          const tasksArray = Array.isArray(response.data) ? response.data : [response.data];
          this.tasks = tasksArray.map(task => ({
            ...task,
            createdAt: typeof task.createdAt === 'string' ? task.createdAt : task.createdAt.toString(),
            updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : task.updatedAt.toString(),
            dueDate: task.dueDate ? (typeof task.dueDate === 'string' ? task.dueDate : task.dueDate.toString()) : undefined
          })) as Task[];
        } else {
          this.errorMessage = response.message || 'Failed to load tasks';
          this.tasks = [];
        }
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;

        if (error.status === 401) {
          // Token expired or invalid, redirect to login
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          this.errorMessage = error.error?.message || 'Failed to load tasks';
        }
      }
    });
  }

  // Role-based permissions
  get canCreateTasks(): boolean {
    if (!this.currentUser) return false;
    // Admin and Owner can create tasks, Viewer cannot
    return ['SystemAdmin', 'Owner', 'Admin'].includes(this.currentUser.role);
  }

  get canEditTasks(): boolean {
    if (!this.currentUser) return false;
    // Admin and Owner can edit tasks, Viewer cannot
    return ['SystemAdmin', 'Owner', 'Admin'].includes(this.currentUser.role);
  }

  // UI Helper methods
  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  // Task actions
  editTask(task: Task): void {
    console.log('Edit task:', task);
    // TODO: Implement edit functionality
    alert(`Edit task: ${task.title}`);
  }

  deleteTaskConfirm(task: Task): void {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.deleteTask(task.id);
    }
  }

  deleteTask(taskId: number): void {
    this.taskService.deleteTask(taskId).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('Task deleted successfully');
          this.loadTasks(); // Reload tasks
        } else {
          alert('Failed to delete task: ' + (response.message || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        alert('Failed to delete task: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  // Auth actions
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

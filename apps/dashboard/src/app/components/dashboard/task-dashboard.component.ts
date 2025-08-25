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
  filteredTasks: Task[] = [];
  isLoading = true;
  errorMessage = '';

  // Task form state
  showTaskForm = false;
  selectedTask: Task | null = null;

  // Filter and sort state
  categoryFilter = 'all';
  statusFilter = 'all';
  priorityFilter = 'all';
  sortBy = 'createdAt';

  // Mobile menu state
  mobileMenuOpen = false;

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
          this.applyFiltersAndSort();
        } else {
          this.errorMessage = response.message || 'Failed to load tasks';
          this.tasks = [];
          this.filteredTasks = [];
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

  // Task form actions
  openCreateForm(): void {
    this.selectedTask = null;
    this.showTaskForm = true;
  }

  openEditForm(task: Task): void {
    this.selectedTask = task;
    this.showTaskForm = true;
  }

  onTaskSaved(): void {
    this.showTaskForm = false;
    this.selectedTask = null;
    this.loadTasks(); // Reload tasks to show the new/updated task
  }

  onFormClosed(): void {
    this.showTaskForm = false;
    this.selectedTask = null;
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

  // Format display text for status
  getStatusDisplay(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  }

  // Format display text for priority
  getPriorityDisplay(priority: string): string {
    switch (priority) {
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return priority;
    }
  }

  // Format display text for category
  getCategoryDisplay(category: string): string {
    switch (category) {
      case 'work':
        return 'Work';
      case 'personal':
        return 'Personal';
      case 'other':
        return 'Other';
      default:
        return category;
    }
  }

  // Filtering and sorting methods
  applyFiltersAndSort(): void {
    let filtered = [...this.tasks];

    // Apply category filter
    if (this.categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === this.categoryFilter);
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === this.statusFilter);
    }

    // Apply priority filter
    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === this.priorityFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'createdAt':
          // Newest first
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        case 'dueDate':
          // Earliest due date first, tasks without due date go to the end
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;  // a goes after b
          if (!b.dueDate) return -1; // b goes after a
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

        case 'priority':
          // High -> Medium -> Low
          const priorityValue = (priority: string) => {
            if (priority === 'high') return 0;
            if (priority === 'medium') return 1;
            return 2; // low
          };
          return priorityValue(a.priority) - priorityValue(b.priority);

        case 'status':
          // Pending -> In Progress -> Completed
          const statusValue = (status: string) => {
            if (status === 'pending') return 0;
            if (status === 'in-progress') return 1;
            return 2; // completed
          };
          return statusValue(a.status) - statusValue(b.status);

        case 'title':
          // Alphabetical A-Z
          return a.title.localeCompare(b.title);

        default:
          return 0;
      }
    });

    this.filteredTasks = filtered;
  }

  // Methods called from template
  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  onSortChange(): void {
    this.applyFiltersAndSort();
  }

  clearFilters(): void {
    this.categoryFilter = 'all';
    this.statusFilter = 'all';
    this.priorityFilter = 'all';
    this.sortBy = 'createdAt';
    this.applyFiltersAndSort();
  }

  formatDate(dateString: string): string {
    // Parse the date string and format without timezone conversion
    // If it's just a date (YYYY-MM-DD), display as is
    // If it's a datetime, extract just the date part
    const date = dateString.split('T')[0];
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-');
      return `${month}/${day}/${year}`;
    }
    return new Date(dateString).toLocaleDateString();
  }

  // Task actions
  // editTask(task: Task): void {
  //   console.log('Edit task:', task);
  //   // TODO: Implement edit functionality
  //   alert(`Edit task: ${task.title}`);
  // }

  deleteTaskConfirm(task: Task): void {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
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
          window.alert('Failed to delete task: ' + (response.message || 'Unknown error'));
        }
      },
      error: (error) => {
        console.error('Error deleting task:', error);
        window.alert('Failed to delete task: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }

  // Auth actions
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Navigation methods
  goToAuditLogs(): void {
    this.router.navigate(['/audit-logs']);
  }

  canViewAuditLogs(): boolean {
    if (!this.currentUser) return false;
    // Only SystemAdmin, Owner, and Admin can view audit logs
    return ['SystemAdmin', 'Owner', 'Admin'].includes(this.currentUser.role);
  }

  // Mobile menu toggle
  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}

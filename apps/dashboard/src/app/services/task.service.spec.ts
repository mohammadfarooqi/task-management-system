import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { environment } from '../../environments/environment';
import { TaskStatus, TaskPriority } from '@task-management-system/data';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch all tasks successfully', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            title: 'Test Task 1',
            description: 'Description 1',
            status: TaskStatus.PENDING,
            priority: TaskPriority.HIGH,
            category: 'work',
            dueDate: new Date('2024-08-30'),
            createdAt: '2024-08-25T10:00:00Z',
            updatedAt: '2024-08-25T10:00:00Z'
          },
          {
            id: 2,
            title: 'Test Task 2',
            description: 'Description 2',
            status: TaskStatus.IN_PROGRESS,
            priority: TaskPriority.MEDIUM,
            category: 'personal',
            createdAt: '2024-08-24T10:00:00Z',
            updatedAt: '2024-08-24T10:00:00Z'
          }
        ]
      };

      service.getTasks().subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data).toHaveLength(2);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when fetching tasks', () => {
      const mockError = {
        error: { message: 'Failed to fetch tasks' },
        status: 500
      };

      service.getTasks().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      req.flush(mockError.error, { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTask', () => {
    it('should fetch a single task by id', () => {
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          title: 'Test Task',
          description: 'Description',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          category: 'work',
          dueDate: new Date('2024-08-30'),
          createdAt: '2024-08-25T10:00:00Z',
          updatedAt: '2024-08-25T10:00:00Z'
        }
      };

      service.getTask(1).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.id).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createTask', () => {
    it('should create a new task', () => {
      const newTask = {
        title: 'New Task',
        description: 'New Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        category: 'work',
        dueDate: new Date('2024-08-30')
      };

      const mockResponse = {
        success: true,
        data: {
          id: 3,
          ...newTask,
          createdAt: '2024-08-25T12:00:00Z',
          updatedAt: '2024-08-25T12:00:00Z'
        },
        message: 'Task created successfully'
      };

      service.createTask(newTask).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.id).toBe(3);
        expect(response.data?.title).toBe('New Task');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newTask);
      req.flush(mockResponse);
    });

    it('should handle validation errors when creating task', () => {
      const invalidTask = {
        title: '', // Invalid: empty title
        description: 'Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        category: 'work'
      };

      const mockError = {
        error: { message: 'Validation failed: Title is required' },
        status: 400
      };

      service.createTask(invalidTask).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
          expect(error.error.message).toContain('Title is required');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks`);
      req.flush(mockError.error, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTask', () => {
    it('should update an existing task', () => {
      const updatedTask = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        category: 'personal',
        dueDate: new Date('2024-09-01')
      };

      const mockResponse = {
        success: true,
        data: {
          id: 1,
          ...updatedTask,
          createdAt: '2024-08-25T10:00:00Z',
          updatedAt: '2024-08-25T14:00:00Z'
        },
        message: 'Task replaced successfully'
      };

      service.updateTask(1, updatedTask).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.data?.title).toBe('Updated Task');
        expect(response.data?.status).toBe(TaskStatus.COMPLETED);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updatedTask);
      req.flush(mockResponse);
    });

    it('should handle 404 when updating non-existent task', () => {
      const updatedTask = {
        title: 'Updated Task',
        description: 'Updated Description',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        category: 'work'
      };

      const mockError = {
        error: { message: 'Task not found' },
        status: 404
      };

      service.updateTask(999, updatedTask).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
          expect(error.error.message).toBe('Task not found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/999`);
      req.flush(mockError.error, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', () => {
      const mockResponse = {
        success: true,
        message: 'Task deleted successfully'
      };

      service.deleteTask(1).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/1`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle 403 when deleting without permission', () => {
      const mockError = {
        error: { message: 'You can only delete tasks you created' },
        status: 403
      };

      service.deleteTask(2).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
          expect(error.error.message).toContain('delete tasks you created');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/tasks/2`);
      req.flush(mockError.error, { status: 403, statusText: 'Forbidden' });
    });
  });
});
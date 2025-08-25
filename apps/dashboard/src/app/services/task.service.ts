import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Task, CreateTaskDto, ApiResponse } from '@task-management-system/data';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get all tasks (filtered by user's permissions)
  getTasks(): Observable<ApiResponse<Task[]>> {
    return this.http.get<ApiResponse<Task[]>>(`${this.apiUrl}/tasks`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get single task by ID
  getTask(id: number): Observable<ApiResponse<Task>> {
    return this.http.get<ApiResponse<Task>>(`${this.apiUrl}/tasks/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create new task
  createTask(task: CreateTaskDto): Observable<ApiResponse<Task>> {
    return this.http.post<ApiResponse<Task>>(`${this.apiUrl}/tasks`, task, {
      headers: this.getAuthHeaders()
    });
  }

  // Update task
  updateTask(id: number, task: Partial<CreateTaskDto>): Observable<ApiResponse<Task>> {
    return this.http.put<ApiResponse<Task>>(`${this.apiUrl}/tasks/${id}`, task, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete task
  deleteTask(id: number): Observable<ApiResponse<{ deleted: boolean }>> {
    return this.http.delete<ApiResponse<{ deleted: boolean }>>(`${this.apiUrl}/tasks/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
import { Component } from '@angular/core';
// import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  credentials = {
    email: 'admin@system.com',
    password: 'password123'
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    // private router: Router
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('Attempting login with:', this.credentials);

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.isLoading = false;
        // TODO: Navigate to dashboard after we create it
        if (response.data) {
          alert('Login successful! Role: ' + response.data.role);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please try again.';
      }
    });
  }
}
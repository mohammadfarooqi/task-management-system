import { Route } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { TaskDashboardComponent } from './components/dashboard/task-dashboard.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: TaskDashboardComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
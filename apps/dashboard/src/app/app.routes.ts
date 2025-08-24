import { Route } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
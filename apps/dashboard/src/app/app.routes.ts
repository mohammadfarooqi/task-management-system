import { Route } from '@angular/router';
import { LoginComponent } from './components/auth/login.component';
import { TaskDashboardComponent } from './components/dashboard/task-dashboard.component';
import { AuditLogComponent } from './components/audit/audit-log.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { RoleType } from '@task-management-system/data';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: TaskDashboardComponent,
    canActivate: [AuthGuard]
  },
  { 
    path: 'audit-logs', 
    component: AuditLogComponent,
    canActivate: [RoleGuard],
    data: { 
      roles: [
        RoleType.SYSTEM_ADMIN,
        RoleType.OWNER,
        RoleType.ADMIN
      ] 
    }
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/login' }
];
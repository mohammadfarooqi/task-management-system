import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login.component';
import { TaskDashboardComponent } from './components/dashboard/task-dashboard.component';
import { TaskFormComponent } from './components/tasks/task-form.component';
import { AuditLogComponent } from './components/audit/audit-log.component';
import { appRoutes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    TaskDashboardComponent,
    TaskFormComponent,
    AuditLogComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    RouterModule.forRoot(appRoutes),
  ],
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor])
    )
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

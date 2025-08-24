import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login.component';
import { appRoutes } from './app.routes';
import { TaskDashboardComponent } from './components/dashboard/task-dashboard.component';

@NgModule({
  declarations: [AppComponent, LoginComponent, TaskDashboardComponent],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    RouterModule.forRoot(appRoutes),
    HttpClientModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}

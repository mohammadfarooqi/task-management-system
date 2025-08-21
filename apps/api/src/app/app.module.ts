import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { User } from './entities/user.entity';
import { Organization } from './entities/organization.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { Task } from './entities/task.entity';
import { AuditLog } from './entities/audit-log.entity';

import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { TaskService } from './services/task.service';
import { AuditService } from './services/audit.service';
import { SeedService } from './services/seed.service';

import { AuthController } from './controllers/auth.controller';
import { TaskController } from './controllers/task.controller';
import { AuditController } from './controllers/audit.controller';

// import { JwtGuard } from '../../../../libs/auth/src/lib/guards/jwt.guard';
import { JwtGuard } from './guards/jwt.guard';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/database.sqlite',
      entities: [
        User,
        Organization,
        Role,
        UserRole,
        Task,
        AuditLog,
      ],
      synchronize: true, // auto create tables (dev only)
      logging: true, // see sql queries in console
    }),
    // make entities available for injection
    TypeOrmModule.forFeature([
      User,
      Organization,
      Role,
      UserRole,
      Task,
      AuditLog,
    ]),
    JwtModule.register({
      global: true, // Make JWT service available everywhere
      secret: process.env.JWT_SECRET || 'super-duper-secret-key-1-2-3',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AppController, AuthController, TaskController, AuditController],
  providers: [
    AppService,
    UserService,
    AuthService,
    TaskService,
    AuditService,
    SeedService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard, // Apply JWT guard globally to all routes
    },
  ],
})
export class AppModule {}

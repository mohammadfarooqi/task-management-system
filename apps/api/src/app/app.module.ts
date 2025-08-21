import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { User } from './entities/user.entity';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: './data/database.sqlite',
      entities: [User],
      synchronize: true, // auto create tables (dev only)
      logging: true, // see sql queries in console
    }),
    // make user entity available for injection
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-duper-secret-key-1-2-3',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthService, UserService],
})
export class AppModule {}

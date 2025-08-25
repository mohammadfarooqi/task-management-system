console.log('📍 main.ts file is being loaded...');

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { GlobalExceptionFilter } from './app/filters/global-exception.filter';
const cookieParser = require('cookie-parser');

console.log('Imports loaded, starting bootstrap...');

async function bootstrap() {
  console.log('Starting NestJS application...');

  try {
    const app = await NestFactory.create(AppModule);
    console.log('NestJS app created successfully');

    // Enable cookie parser middleware
    app.use(cookieParser());

    // Enable CORS for frontend development
    app.enableCors({
      origin: ['http://localhost:4200', 'http://localhost:4201'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    });

    // Enable validation pipe globally
    app.useGlobalPipes(new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }));

    // Enable global exception filter for consistent error responses
    app.useGlobalFilters(new GlobalExceptionFilter());

    // Enable class serializer interceptor to handle @Exclude() decorators
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    const globalPrefix = process.env.API_PREFIX || 'api';
    app.setGlobalPrefix(globalPrefix);
    const port = process.env.PORT || 3000;

    await app.listen(port);
    Logger.log(
      `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
    );
  } catch (error) {
    console.error('❌ Failed to start NestJS app:', error);
  }
}

console.log('📍 About to call bootstrap...');

bootstrap();

console.log('📍 main.ts file is being loaded...');

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

console.log('Imports loaded, starting bootstrap...');

async function bootstrap() {
  console.log('Starting NestJS application...');

  try {
    const app = await NestFactory.create(AppModule);
    console.log('NestJS app created successfully');

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

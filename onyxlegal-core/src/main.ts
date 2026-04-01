import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Structured logging
  app.useLogger(app.get(PinoLogger));

  // REST API prefix
  app.setGlobalPrefix('api/v1');

  // Input validation (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,           // Auto-transform types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS — restrict in production
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 OnyxLegal API running on http://localhost:${port}/api/v1`);
  logger.log(`📋 Modules: auth, contracts, templates, ai, analytics, notifications`);
}

bootstrap();

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Structured logging
  app.useLogger(app.get(PinoLogger));

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: false, // Managed by Next.js frontend
    crossOriginEmbedderPolicy: false,
  }));

  // Cookie parser (needed for HttpOnly cookie auth)
  app.use(cookieParser());

  // REST API prefix
  app.setGlobalPrefix('api/v1');

  // Input validation (class-validator)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — restrict in production, allow cookies
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`OnyxLegal API running on http://localhost:${port}/api/v1`);
}

bootstrap();

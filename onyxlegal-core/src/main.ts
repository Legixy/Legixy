import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/environment';

async function bootstrap() {
  /**
   * Configuration is checked BEFORE the Nest container is built.
   *
   * Deliberately first. A missing DATABASE_URL discovered during module
   * construction surfaces as a Prisma connection error three frames deep,
   * and a missing JWT_SECRET surfaces as a passport strategy failure on the
   * first login attempt — both a long way from the thing that is actually
   * wrong. This says the name of the variable and stops.
   *
   * Slice 8 established that warnings get ignored. Required means refuse.
   */
  const environment = validateEnvironment();
  if (!environment.ok) {
    // console, not the Nest logger: the logger is not constructed yet, and a
    // configuration failure must be readable even when logging is broken.
    console.error('\nLegixy cannot start. Configuration problems:\n');
    for (const problem of environment.errors) console.error(`  · ${problem}`);
    console.error('\nRun `npm run preflight` for the full report.\n');
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Structured logging
  app.useLogger(app.get(PinoLogger));

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Managed by Next.js frontend
      crossOriginEmbedderPolicy: false,
    }),
  );

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
    // Without this, a cross-origin fetch cannot read Content-Disposition and
    // every downloaded file is saved under a fallback name instead of its own.
    exposedHeaders: ['Content-Disposition'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  const logger = new Logger('Bootstrap');
  logger.log(`Legixy API running on http://localhost:${port}/api/v1`);
}

bootstrap();

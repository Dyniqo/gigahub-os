import compression from 'compression';
import cookieParser from 'cookie-parser';
import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export function setupSecurity(app: INestApplication, configService: ConfigService): void {
  const origins = configService.getOrThrow<string[]>('security.corsOrigins');

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-Id'],
  });

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
}

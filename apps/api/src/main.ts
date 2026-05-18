import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { HttpExceptionFilter, RequestIdInterceptor, ResponseInterceptor } from '@app/common';
import { AppModule } from './app.module';
import { setupSecurity } from './bootstrap/setup-security';
import { setupSwagger } from './bootstrap/setup-swagger';
import { setupValidation } from './bootstrap/setup-validation';
import { setupVersioning } from './bootstrap/setup-versioning';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);

  setupSecurity(app, configService);
  setupValidation(app);
  setupVersioning(app, configService);
  setupSwagger(app, configService);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestIdInterceptor(), new ResponseInterceptor());
  app.enableShutdownHooks();

  await app.listen(
    configService.getOrThrow<number>('app.port'),
    configService.getOrThrow<string>('app.host'),
  );
}

void bootstrap();

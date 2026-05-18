import { type INestApplication, VersioningType } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

export function setupVersioning(app: INestApplication, configService: ConfigService): void {
  app.setGlobalPrefix(configService.getOrThrow<string>('app.apiPrefix'));

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: configService.getOrThrow<string>('app.apiVersion'),
  });
}

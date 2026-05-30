import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, configService: ConfigService): void {
  const appName = configService.get<string>('app.name') ?? 'GigaHub OS';
  const appVersion = configService.get<string>('app.version') ?? '0.1.0';

  const config = new DocumentBuilder()
    .setTitle(`${appName} API`)
    .setDescription(
      'Freelance marketplace API with identity, profiles, projects, proposals, contracts, milestones, audit logs, and transactional outbox.',
    )
    .setVersion(appVersion)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the access token with the Bearer prefix.',
      },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: `${appName} API`,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}

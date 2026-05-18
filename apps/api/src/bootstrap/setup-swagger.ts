import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication, configService: ConfigService): void {
  if (!configService.getOrThrow<boolean>('swagger.enabled')) {
    return;
  }

  const config = new DocumentBuilder()
    .setTitle(configService.getOrThrow<string>('app.name'))
    .setDescription('Production-grade freelance contract and escrow platform API.')
    .setVersion('0.1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'jwt',
    )
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(configService.getOrThrow<string>('swagger.path'), app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });
}

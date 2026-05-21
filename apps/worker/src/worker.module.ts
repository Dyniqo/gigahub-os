import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, PrismaModule, validateEnvironment } from '@app/common';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    PrismaModule,
  ],
})
export class WorkerModule {}

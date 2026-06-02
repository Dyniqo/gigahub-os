import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configuration, PrismaModule, validateEnvironment } from '@app/common';
import { OutboxRelayModule } from './modules/outbox-relay/outbox-relay.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      validate: validateEnvironment,
    }),
    PrismaModule,
    OutboxRelayModule,
  ],
})
export class WorkerModule {}

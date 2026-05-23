import { Module } from '@nestjs/common';
import { UsersController } from './interfaces/http/users.controller';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

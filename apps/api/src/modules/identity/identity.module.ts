import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './interfaces/http/auth.controller';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { PasswordHasherService } from './infrastructure/password-hasher.service';
import { TokenService } from './infrastructure/token.service';
import { AuthService } from './services/auth.service';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasherService, TokenService, JwtStrategy],
  exports: [AuthService],
})
export class IdentityModule {}

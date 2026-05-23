import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from '../../services/auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthResponse } from './presenters/auth.presenter';

@ApiTags('Identity')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    type: AuthResponse,
  })
  register(@Body() dto: RegisterDto, @Req() request: Request): Promise<AuthResponse> {
    return this.authService.register(dto, {
      userAgent: request.header('user-agent'),
      ipAddress: request.ip,
    });
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: AuthResponse,
  })
  login(@Body() dto: LoginDto, @Req() request: Request): Promise<AuthResponse> {
    return this.authService.login(dto, {
      userAgent: request.header('user-agent'),
      ipAddress: request.ip,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    type: AuthResponse,
  })
  refresh(@Body() dto: RefreshTokenDto, @Req() request: Request): Promise<AuthResponse> {
    return this.authService.refresh(dto.refreshToken, {
      userAgent: request.header('user-agent'),
      ipAddress: request.ip,
    });
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    schema: {
      properties: {
        revoked: {
          type: 'boolean',
        },
      },
    },
  })
  logout(@Body() dto: RefreshTokenDto): Promise<{ revoked: boolean }> {
    return this.authService.logout(dto.refreshToken);
  }
}

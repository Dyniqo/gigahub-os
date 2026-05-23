import { createHmac, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const REFRESH_TOKEN_TTL_DAYS = 30;

@Injectable()
export class TokenService {
  constructor(private readonly configService: ConfigService) {}

  createRefreshToken(): string {
    return randomBytes(64).toString('base64url');
  }

  hashRefreshToken(token: string): string {
    return createHmac('sha256', this.configService.getOrThrow<string>('jwt.refreshSecret'))
      .update(token)
      .digest('hex');
  }

  getRefreshTokenExpiresAt(): Date {
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);

    return expiresAt;
  }
}

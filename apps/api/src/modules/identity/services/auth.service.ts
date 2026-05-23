import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@app/common';
import {
  Prisma,
  UserRole,
  UserStatus,
} from '@app/common/infrastructure/database/generated/prisma/client';
import { UserResponse } from '../../users/interfaces/http/presenters/user.presenter';
import { JwtPayload } from '../application/jwt-payload';
import { TokenContext } from '../application/token-context';
import { RegistrationRole } from '../domain/registration-role';
import { PasswordHasherService } from '../infrastructure/password-hasher.service';
import { TokenService } from '../infrastructure/token.service';
import { LoginDto } from '../interfaces/http/dto/login.dto';
import { RegisterDto } from '../interfaces/http/dto/register.dto';
import { AuthResponse } from '../interfaces/http/presenters/auth.presenter';

const ACCESS_TOKEN_TTL_SECONDS = 900;

const authUserSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type AuthUserRecord = Prisma.UserGetPayload<{
  select: typeof authUserSelect;
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordHasherService: PasswordHasherService,
    private readonly tokenService: TokenService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, context: TokenContext): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered');
    }

    const passwordHash = await this.passwordHasherService.hash(dto.password);

    try {
      const user = await this.prismaService.user.create({
        data: {
          email,
          passwordHash,
          role: this.toUserRole(dto.role),
          status: UserStatus.ACTIVE,
        },
        select: authUserSelect,
      });

      return this.createAuthResponse(user, context);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Email is already registered');
      }

      throw error;
    }
  }

  async login(dto: LoginDto, context: TokenContext): Promise<AuthResponse> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        ...authUserSelect,
        passwordHash: true,
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid authentication credentials');
    }

    const passwordMatches = await this.passwordHasherService.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid authentication credentials');
    }

    return this.createAuthResponse(user, context);
  }

  async refresh(refreshToken: string, context: TokenContext): Promise<AuthResponse> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const storedToken = await this.prismaService.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          select: authUserSelect,
        },
      },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.user.status !== UserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prismaService.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return this.createAuthResponse(storedToken.user, context);
  }

  async logout(refreshToken: string): Promise<{ revoked: boolean }> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const storedToken = await this.prismaService.refreshToken.findUnique({
      where: {
        tokenHash,
      },
      select: {
        id: true,
        revokedAt: true,
      },
    });

    if (!storedToken || storedToken.revokedAt) {
      return {
        revoked: false,
      };
    }

    await this.prismaService.refreshToken.update({
      where: {
        id: storedToken.id,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      revoked: true,
    };
  }

  private async createAuthResponse(
    user: AuthUserRecord,
    context: TokenContext,
  ): Promise<AuthResponse> {
    const refreshToken = this.tokenService.createRefreshToken();
    const refreshTokenHash = this.tokenService.hashRefreshToken(refreshToken);

    await this.prismaService.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt: this.tokenService.getRefreshTokenExpiresAt(),
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('jwt.accessSecret'),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    });

    return {
      user: UserResponse.fromRecord(user),
      tokens: {
        accessToken,
        refreshToken,
        tokenType: 'Bearer',
        expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      },
    };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private toUserRole(role: RegistrationRole): UserRole {
    if (role === RegistrationRole.CLIENT) {
      return UserRole.CLIENT;
    }

    return UserRole.FREELANCER;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}

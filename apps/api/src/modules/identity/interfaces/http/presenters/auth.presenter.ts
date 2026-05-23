import { ApiProperty } from '@nestjs/swagger';
import { UserResponse } from '../../../../users/interfaces/http/presenters/user.presenter';

export class TokenResponse {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;

  @ApiProperty({
    example: 'Bearer',
  })
  tokenType!: 'Bearer';

  @ApiProperty({
    example: 900,
  })
  expiresIn!: number;
}

export class AuthResponse {
  @ApiProperty({
    type: UserResponse,
  })
  user!: UserResponse;

  @ApiProperty({
    type: TokenResponse,
  })
  tokens!: TokenResponse;
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../../identity/application/authenticated-user';
import { CurrentUser } from '../../../identity/interfaces/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../identity/interfaces/http/guards/jwt-auth.guard';
import { UsersService } from '../../services/users.service';
import { UserResponse } from './presenters/user.presenter';

@ApiTags('Users')
@ApiBearerAuth('jwt')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({
    type: UserResponse,
  })
  me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponse> {
    return this.usersService.findCurrentUser(user.id);
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/common';
import { UserResponse } from '../interfaces/http/presenters/user.presenter';

const userSelect = {
  id: true,
  email: true,
  role: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prismaService: PrismaService) {}

  async findCurrentUser(userId: string): Promise<UserResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: userSelect,
    });

    if (!user) {
      throw new NotFoundException('User was not found');
    }

    return UserResponse.fromRecord(user);
  }
}

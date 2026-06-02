import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../../../identity/application/authenticated-user';
import { CurrentUser } from '../../../identity/interfaces/http/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../identity/interfaces/http/guards/jwt-auth.guard';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardResponse } from './presenters/dashboard.presenter';

@ApiTags('Dashboard')
@ApiBearerAuth('jwt')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('me')
  @ApiOkResponse({
    type: DashboardResponse,
  })
  findMine(@CurrentUser() user: AuthenticatedUser): Promise<DashboardResponse> {
    return this.dashboardService.getMyDashboard(user.id);
  }
}

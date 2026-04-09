import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  getDashboard(@Req() req: any) {
    return this.dashboardService.getDashboard(req.groupContext.groupId);
  }
}

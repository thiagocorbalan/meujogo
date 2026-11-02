import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../common/guards/super-admin.guard.js';
import { AdminService } from './admin.service.js';

type Period = 'day' | 'week' | 'month';

@Controller('admin')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Throttle({ default: { ttl: 60000, limit: 20 } })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats(@Query('period') period?: Period) {
    return this.adminService.getStats(period ?? 'week');
  }

  @Get('stats/stripe')
  getStripeStats() {
    return this.adminService.getStripeStats();
  }
}

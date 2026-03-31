import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('top-scorers')
  getTopScorers(
    @Query('limit') limit?: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.statsService.getTopScorers(
      limit ? parseInt(limit, 10) : 10,
      seasonId ? parseInt(seasonId, 10) : undefined,
    );
  }

  @Get('top-elo')
  getTopElo(
    @Query('limit') limit?: string,
    @Query('seasonId') seasonId?: string,
  ) {
    return this.statsService.getTopElo(
      limit ? parseInt(limit, 10) : 10,
      seasonId ? parseInt(seasonId, 10) : undefined,
    );
  }
}

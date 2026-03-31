import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';

@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('top-scorers')
  getTopScorers(@Query() query: StatsQueryDto) {
    return this.statsService.getTopScorers(
      query.limit ?? 10,
      query.seasonId,
    );
  }

  @Get('top-elo')
  getTopElo(@Query() query: StatsQueryDto) {
    return this.statsService.getTopElo(
      query.limit ?? 10,
      query.seasonId,
    );
  }
}

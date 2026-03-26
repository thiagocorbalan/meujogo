import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';

@Controller('stats')
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

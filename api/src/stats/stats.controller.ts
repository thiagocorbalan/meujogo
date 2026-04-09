import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { StatsQueryDto } from './dto/stats-query.dto.js';

@Controller('stats')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('top-scorers')
  getTopScorers(@Req() req: any, @Query() query: StatsQueryDto) {
    return this.statsService.getTopScorers(
      req.groupContext.groupId,
      query.limit ?? 10,
      query.seasonId,
    );
  }

  @Get('top-elo')
  getTopElo(@Req() req: any, @Query() query: StatsQueryDto) {
    return this.statsService.getTopElo(
      req.groupContext.groupId,
      query.limit ?? 10,
      query.seasonId,
    );
  }
}

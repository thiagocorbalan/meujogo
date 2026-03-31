import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('sessions/:sessionId/ranking')
  getSessionRanking(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.rankingService.getSessionRanking(sessionId);
  }

  @Get('seasons/:seasonId/ranking')
  getSeasonRanking(@Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.rankingService.getSeasonRanking(seasonId);
  }
}

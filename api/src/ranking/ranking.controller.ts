import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller()
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

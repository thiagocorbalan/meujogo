import { Controller, Get, Param, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';

@Controller()
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get('sessions/:sessionId/ranking')
  getSessionRanking(@Req() req: any, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.rankingService.getSessionRanking(sessionId, req.groupContext.groupId);
  }

  @Get('seasons/:seasonId/ranking')
  getSeasonRanking(@Req() req: any, @Param('seasonId', ParseIntPipe) seasonId: number) {
    return this.rankingService.getSeasonRanking(seasonId, req.groupContext.groupId);
  }
}

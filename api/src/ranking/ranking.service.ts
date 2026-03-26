import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateRanking, MatchResult } from '../engines/ranking.engine';

@Injectable()
export class RankingService {
  constructor(private readonly prisma: PrismaService) {}

  async getSessionRanking(sessionId: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        sessionId,
        events: { some: { type: 'MATCH_ENDED' } },
      },
      include: { teamA: true, teamB: true },
    });

    const teams = await this.prisma.team.findMany({
      where: { sessionId },
    });

    const matchResults: MatchResult[] = matches.map((m) => ({
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      isDraw: m.isDraw,
      winnerId: m.winnerId,
    }));

    return calculateRanking(matchResults, teams);
  }

  async getSeasonRanking(seasonId: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        session: { seasonId },
        events: { some: { type: 'MATCH_ENDED' } },
      },
      include: { teamA: true, teamB: true },
    });

    const teams = await this.prisma.team.findMany({
      where: { session: { seasonId } },
    });

    const matchResults: MatchResult[] = matches.map((m) => ({
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      isDraw: m.isDraw,
      winnerId: m.winnerId,
    }));

    return calculateRanking(matchResults, teams);
  }
}

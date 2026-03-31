import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTopScorers(limit = 10, seasonId?: number) {
    if (!seasonId) {
      return this.prisma.player.findMany({
        where: { isActive: true, goals: { gt: 0 } },
        orderBy: { goals: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          position: true,
          goals: true,
          games: true,
          elo: true,
        },
      });
    }

    const goalCounts = await this.prisma.goal.groupBy({
      by: ['playerId'],
      where: {
        match: { session: { seasonId } },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: limit,
    });

    if (goalCounts.length === 0) return [];

    const playerIds = goalCounts.map((g) => g.playerId);
    const players = await this.prisma.player.findMany({
      where: { id: { in: playerIds }, isActive: true },
      select: {
        id: true,
        name: true,
        position: true,
        goals: true,
        games: true,
        elo: true,
      },
    });

    const playerMap = new Map(players.map((p) => [p.id, p]));
    return goalCounts
      .map((g) => {
        const player = playerMap.get(g.playerId);
        if (!player) return null;
        return {
          ...player,
          goals: g._count.id,
        };
      })
      .filter(Boolean);
  }

  async getTopElo(limit = 10, _seasonId?: number) {
    return this.prisma.player.findMany({
      where: { isActive: true },
      orderBy: { elo: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        position: true,
        elo: true,
        goals: true,
        games: true,
      },
    });
  }
}

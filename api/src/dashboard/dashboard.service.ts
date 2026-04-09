import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(groupId: number) {
    const currentSession = await this.prisma.session.findFirst({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: { teams: true, matches: true },
    });

    const activePlayersCount = await this.prisma.player.count({
      where: { groupId, isActive: true },
    });

    const confirmedCount = currentSession
      ? await this.prisma.attendance.count({
          where: { sessionId: currentSession.id, status: 'ATIVO' },
        })
      : 0;

    const teamsCount = currentSession
      ? await this.prisma.team.count({
          where: { sessionId: currentSession.id },
        })
      : 0;

    const topScorer = await this.prisma.player.findFirst({
      where: { groupId, isActive: true },
      orderBy: { goals: 'desc' },
    });

    const highestElo = await this.prisma.player.findFirst({
      where: { groupId, isActive: true },
      orderBy: { elo: 'desc' },
    });

    const recentSessions = await this.prisma.session.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { champion: true, season: true, _count: { select: { matches: true } } },
    });

    return {
      currentSession,
      activePlayersCount,
      confirmedCount,
      teamsCount,
      topScorer,
      highestElo,
      recentSessions,
      seasonRanking: null,
    };
  }
}

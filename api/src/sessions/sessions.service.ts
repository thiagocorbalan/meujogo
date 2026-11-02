import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import {
  processSessionEloFromParticipation,
  MatchParticipation,
  MatchResult,
} from '../engines/elo.engine';
import {
  calculateRanking,
  MatchResult as RankingMatchResult,
} from '../engines/ranking.engine';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(groupId: number) {
    return this.prisma.session.findMany({
      where: { groupId },
      include: {
        season: true,
        teams: true,
        matches: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, groupId: number) {
    const session = await this.prisma.session.findFirst({
      where: { id, groupId },
      include: {
        season: true,
        teams: true,
        matches: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session #${id} not found`);
    }

    return session;
  }

  async create(dto: CreateSessionDto, groupId: number) {
    const settings = await this.prisma.settings.findUnique({
      where: { groupId },
    });
    const swapTime = settings?.teamSwapEnabled
      ? (settings.teamSwapTimeMin ?? 0)
      : 0;
    const totalMatches = Math.floor(
      dto.durationMinutes / (dto.matchDurationMinutes + swapTime),
    );

    const session = await this.prisma.session.create({
      data: {
        seasonId: dto.seasonId,
        durationMinutes: dto.durationMinutes,
        matchDurationMinutes: dto.matchDurationMinutes,
        totalMatches,
        status: 'PENDING',
        groupId,
      },
    });

    const fixoPlayers = await this.prisma.player.findMany({
      where: { isActive: true, type: 'FIXO', groupId },
    });

    if (fixoPlayers.length > 0) {
      await this.prisma.attendance.createMany({
        data: fixoPlayers.map((player) => ({
          sessionId: session.id,
          playerId: player.id,
          status: 'AUSENTE' as const,
        })),
      });
    }

    return session;
  }

  async start(id: number, groupId: number) {
    const session = await this.prisma.session.findFirst({
      where: { id, groupId },
    });

    if (!session) {
      throw new NotFoundException(`Session #${id} not found`);
    }

    if (session.status !== 'PENDING') {
      throw new BadRequestException(
        'Session must be in PENDING status to start',
      );
    }

    return this.prisma.session.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async end(id: number, groupId: number) {
    const session = await this.prisma.session.findFirst({
      where: { id, groupId },
    });

    if (!session) {
      throw new NotFoundException(`Session #${id} not found`);
    }

    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Session must be IN_PROGRESS to end');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.session.update({
        where: { id },
        data: { status: 'FINISHED' },
      });

      const settings = await tx.settings.findFirst({ where: { groupId } });
      const kFactor = settings?.kFactor ?? 32;

      const matches = await tx.match.findMany({
        where: {
          sessionId: id,
          events: { some: { type: 'MATCH_ENDED' } },
        },
      });

      const teams = await tx.team.findMany({
        where: { sessionId: id },
        include: { players: { include: { player: true } } },
      });

      const matchIds = matches.map((m) => m.id);
      const matchPlayers = matchIds.length
        ? await tx.matchPlayer.findMany({
            where: { matchId: { in: matchIds } },
          })
        : [];

      const playerEloMap = new Map<number, number>();
      for (const team of teams) {
        for (const tp of team.players) {
          playerEloMap.set(tp.player.id, tp.player.elo);
        }
      }
      const missingPlayerIds = Array.from(
        new Set(
          matchPlayers
            .map((mp) => mp.playerId)
            .filter((pid) => !playerEloMap.has(pid)),
        ),
      );
      if (missingPlayerIds.length) {
        const extraPlayers = await tx.player.findMany({
          where: { id: { in: missingPlayerIds } },
          select: { id: true, elo: true },
        });
        for (const p of extraPlayers) playerEloMap.set(p.id, p.elo);
      }

      const participations: MatchParticipation[] = matchPlayers.map((mp) => ({
        matchId: mp.matchId,
        playerId: mp.playerId,
        teamId: mp.teamId,
        elo: playerEloMap.get(mp.playerId) ?? 1000,
      }));

      const matchResults: MatchResult[] = matches.map((m) => ({
        matchId: m.id,
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        isDraw: m.isDraw,
        winnerId: m.winnerId,
      }));

      const eloUpdates = processSessionEloFromParticipation(
        participations,
        matchResults,
        kFactor,
      );

      await Promise.all(
        eloUpdates
          .filter((u) => u.newElo !== u.oldElo)
          .map((u) =>
            tx.player.update({
              where: { id: u.playerId },
              data: { elo: u.newElo },
            }),
          ),
      );

      const rankingMatchResults: RankingMatchResult[] = matches.map((m) => ({
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        isDraw: m.isDraw,
        winnerId: m.winnerId,
      }));

      const teamsForRanking = teams.map((t) => ({
        id: t.id,
        name: t.name,
        color: t.color,
      }));

      const ranking = calculateRanking(rankingMatchResults, teamsForRanking);

      let champion: any = null;
      if (ranking.length > 0) {
        const bestTeam = ranking[0]!;
        champion = await tx.champion.create({
          data: {
            sessionId: id,
            teamId: bestTeam.teamId,
          },
          include: {
            team: {
              include: {
                players: { include: { player: true } },
              },
            },
          },
        });
      }

      return { session: updated, champion, ranking };
    });
  }
}

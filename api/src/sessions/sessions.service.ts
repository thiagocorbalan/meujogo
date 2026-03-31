import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { processSessionElo, PlayerWithTeam, MatchResult } from '../engines/elo.engine';
import { calculateRanking, MatchResult as RankingMatchResult } from '../engines/ranking.engine';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.session.findMany({
      include: {
        season: true,
        teams: true,
        matches: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const session = await this.prisma.session.findUnique({
      where: { id },
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

  async create(dto: CreateSessionDto) {
    const totalMatches = Math.floor(dto.durationMinutes / dto.matchDurationMinutes);

    const session = await this.prisma.session.create({
      data: {
        seasonId: dto.seasonId,
        durationMinutes: dto.durationMinutes,
        matchDurationMinutes: dto.matchDurationMinutes,
        totalMatches,
        status: 'PENDING',
      },
    });

    const fixoPlayers = await this.prisma.player.findMany({
      where: { isActive: true, type: 'FIXO' },
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

  async start(id: number) {
    const session = await this.prisma.session.findUnique({ where: { id } });

    if (!session) {
      throw new NotFoundException(`Session #${id} not found`);
    }

    if (session.status !== 'PENDING') {
      throw new BadRequestException('Session must be in PENDING status to start');
    }

    return this.prisma.session.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async end(id: number) {
    const session = await this.prisma.session.findUnique({ where: { id } });

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

      const settings = await tx.settings.findUnique({ where: { id: 1 } });
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

      const players: PlayerWithTeam[] = teams.flatMap((team) =>
        team.players.map((tp) => ({
          playerId: tp.player.id,
          elo: tp.player.elo,
          teamId: team.id,
        })),
      );

      const matchResults: MatchResult[] = matches.map((m) => ({
        teamAId: m.teamAId,
        teamBId: m.teamBId,
        scoreA: m.scoreA,
        scoreB: m.scoreB,
        isDraw: m.isDraw,
        winnerId: m.winnerId,
      }));

      const eloUpdates = processSessionElo(players, matchResults, kFactor);

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
        const bestTeam = ranking[0];
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

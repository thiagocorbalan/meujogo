import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { calculateRanking, MatchResult } from '../engines/ranking.engine';

@Injectable()
export class ChampionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(groupId: number) {
    return this.prisma.champion.findMany({
      where: { session: { groupId } },
      include: {
        team: {
          include: {
            players: {
              include: { player: true },
            },
          },
        },
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, groupId: number) {
    const champion = await this.prisma.champion.findFirst({
      where: { id, session: { groupId } },
      include: {
        team: { include: { players: { include: { player: true } } } },
        session: true,
      },
    });
    if (!champion) throw new BadRequestException(`Champion #${id} not found`);
    return champion;
  }

  async findBySession(sessionId: number, groupId: number) {
    return this.prisma.champion.findFirst({
      where: { sessionId, session: { groupId } },
      include: {
        team: { include: { players: { include: { player: true } } } },
        session: true,
      },
    });
  }

  async create(sessionId: number, groupId: number) {
    const matches = await this.prisma.match.findMany({
      where: {
        sessionId,
        session: { groupId },
        events: { some: { type: 'MATCH_ENDED' } },
      },
    });

    const teams = await this.prisma.team.findMany({
      where: { sessionId, session: { groupId } },
    });

    const matchResults: MatchResult[] = matches.map((m) => ({
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      isDraw: m.isDraw,
      winnerId: m.winnerId,
    }));

    const ranking = calculateRanking(matchResults, teams);

    if (ranking.length === 0) {
      throw new BadRequestException(
        'Cannot determine champion: no finished matches in this session.',
      );
    }

    const bestTeam = ranking[0]!;

    return this.prisma.champion.create({
      data: {
        sessionId,
        teamId: bestTeam.teamId,
      },
      include: { team: true, session: true },
    });
  }

  uploadPhoto(id: number, photoUrl: string, groupId: number) {
    return this.prisma.champion.update({
      where: { id },
      data: { photoUrl },
    });
  }
}

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { drawTeamsRandom, drawTeamsBalanced } from '../engines/team-draw.engine.js';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySession(sessionId: number, groupId: number) {
    return this.prisma.team.findMany({
      where: { sessionId, session: { groupId } },
      include: {
        players: {
          include: { player: true },
        },
      },
    });
  }

  async draw(sessionId: number, groupId: number, mode?: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
      include: {
        matches: {
          include: { events: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    const hasActiveMatch = session.matches.some((match) => {
      const hasEnded = match.events.some((e) => e.type === 'MATCH_ENDED');
      return !hasEnded;
    });

    if (hasActiveMatch) {
      throw new ForbiddenException('Session has an active match. Cannot re-draw teams.');
    }

    await this.prisma.$transaction(async (tx) => {
      const existingTeams = await tx.team.findMany({ where: { sessionId } });
      const teamIds = existingTeams.map((t) => t.id);
      if (teamIds.length > 0) {
        await tx.champion.deleteMany({ where: { sessionId } });
        const existingMatches = await tx.match.findMany({
          where: { sessionId },
          select: { id: true },
        });
        const matchIds = existingMatches.map((m) => m.id);
        if (matchIds.length > 0) {
          await tx.goal.deleteMany({ where: { matchId: { in: matchIds } } });
          await tx.matchEvent.deleteMany({ where: { matchId: { in: matchIds } } });
          await tx.match.deleteMany({ where: { sessionId } });
        }
        await tx.teamPlayer.deleteMany({ where: { teamId: { in: teamIds } } });
        await tx.team.deleteMany({ where: { sessionId } });
      }
    });

    const settings = await this.prisma.settings.findUnique({
      where: { groupId },
      include: { vests: true },
    });

    const attendances = await this.prisma.attendance.findMany({
      where: {
        sessionId,
        status: 'ATIVO',
        player: { position: 'LINHA' },
      },
      include: { player: true },
    });

    const players = attendances.map((a) => ({
      id: a.player.id,
      name: a.player.name,
      elo: a.player.elo,
    }));

    const drawMode = mode ?? settings?.drawMode ?? 'ALEATORIO';
    const playersPerTeam = settings?.playersPerTeam ?? 5;
    const maxTeams = settings?.maxTeams ?? 4;

    const drawnTeams =
      drawMode === 'EQUILIBRADO'
        ? drawTeamsBalanced(players, playersPerTeam, maxTeams)
        : drawTeamsRandom(players, playersPerTeam, maxTeams);

    const vests = settings?.vests ?? [];

    const createdTeams = await Promise.all(
      drawnTeams.map(async (drawnTeam, index) => {
        const vest = vests[index];
        const team = await this.prisma.team.create({
          data: {
            sessionId,
            name: vest?.name ?? `Time ${index + 1}`,
            color: vest?.color ?? '#000000',
            players: {
              create: drawnTeam.players.map((p) => ({ playerId: p.id })),
            },
          },
          include: {
            players: {
              include: { player: true },
            },
          },
        });
        return team;
      }),
    );

    return createdTeams;
  }
}

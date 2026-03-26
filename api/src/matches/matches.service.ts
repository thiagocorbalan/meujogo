import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartMatchDto } from './dto/start-match.dto';
import { RegisterGoalDto } from './dto/register-goal.dto';
import { EndMatchDto } from './dto/end-match.dto';
import { getNextMatch } from '../engines/match-rotation.engine';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  findBySession(sessionId: number) {
    return this.prisma.match.findMany({
      where: { sessionId },
      include: {
        teamA: true,
        teamB: true,
        winner: true,
        goals: true,
        events: true,
      },
      orderBy: { matchOrder: 'asc' },
    });
  }

  async start(sessionId: number, dto: StartMatchDto) {
    const activeMatch = await this.prisma.match.findFirst({
      where: {
        sessionId,
        events: { some: { type: 'MATCH_STARTED' } },
        NOT: { events: { some: { type: 'MATCH_ENDED' } } },
      },
    });

    if (activeMatch) {
      throw new BadRequestException(
        'There is already an active match in this session. End it before starting a new one.',
      );
    }

    // Auto-transition session from PENDING to IN_PROGRESS on first match
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (session?.status === 'PENDING') {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    const count = await this.prisma.match.count({ where: { sessionId } });

    const match = await this.prisma.match.create({
      data: {
        sessionId,
        teamAId: dto.teamAId,
        teamBId: dto.teamBId,
        matchOrder: count + 1,
      },
    });

    await this.prisma.matchEvent.create({
      data: {
        matchId: match.id,
        type: 'MATCH_STARTED',
      },
    });

    return match;
  }

  async registerGoal(matchId: number, dto: RegisterGoalDto) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: { events: true },
    });

    const hasStarted = match.events.some((e) => e.type === 'MATCH_STARTED');
    const hasEnded = match.events.some((e) => e.type === 'MATCH_ENDED');

    if (!hasStarted || hasEnded) {
      throw new BadRequestException(
        'Cannot register a goal: match is not active.',
      );
    }

    if (dto.teamId !== match.teamAId && dto.teamId !== match.teamBId) {
      throw new BadRequestException(
        'teamId must be one of the two teams in this match.',
      );
    }

    await this.prisma.goal.create({
      data: {
        matchId,
        playerId: dto.playerId,
        teamId: dto.teamId,
        minute: dto.minute,
      },
    });

    await this.prisma.matchEvent.create({
      data: {
        matchId,
        type: 'GOAL_SCORED',
        payload: {
          playerId: dto.playerId,
          teamId: dto.teamId,
          minute: dto.minute ?? null,
        },
      },
    });

    const isTeamA = dto.teamId === match.teamAId;

    await this.prisma.match.update({
      where: { id: matchId },
      data: isTeamA ? { scoreA: { increment: 1 } } : { scoreB: { increment: 1 } },
    });

    await this.prisma.player.update({
      where: { id: dto.playerId },
      data: { goals: { increment: 1 } },
    });

    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: { goals: true },
    });
  }

  async end(matchId: number, dto: EndMatchDto) {
    const match = await this.prisma.match.findUniqueOrThrow({
      where: { id: matchId },
      include: {
        teamA: { include: { players: true } },
        teamB: { include: { players: true } },
        events: true,
      },
    });

    const alreadyEnded = match.events.some((e) => e.type === 'MATCH_ENDED');
    if (alreadyEnded) {
      throw new BadRequestException('This match has already been ended.');
    }

    let winnerId: number | null = null;
    let isDraw = false;

    if (match.scoreA > match.scoreB) {
      winnerId = match.teamAId;
    } else if (match.scoreB > match.scoreA) {
      winnerId = match.teamBId;
    } else {
      isDraw = true;
      winnerId = dto.winnerId ?? null;

      if (match.matchOrder === 1 && !winnerId) {
        throw new BadRequestException(
          'First match ended in a draw. A winnerId must be provided for rotation.',
        );
      }

      if (winnerId && winnerId !== match.teamAId && winnerId !== match.teamBId) {
        throw new BadRequestException(
          'winnerId must be one of the two teams in the match.',
        );
      }
    }

    await this.prisma.matchEvent.create({
      data: {
        matchId,
        type: 'MATCH_ENDED',
      },
    });

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: { winnerId, isDraw },
    });

    const allPlayerIds = [
      ...match.teamA.players.map((tp) => tp.playerId),
      ...match.teamB.players.map((tp) => tp.playerId),
    ];

    await Promise.all(
      allPlayerIds.map((playerId) =>
        this.prisma.player.update({
          where: { id: playerId },
          data: { games: { increment: 1 } },
        }),
      ),
    );

    return updated;
  }

  async getNextMatch(sessionId: number) {
    const settings = await this.prisma.settings.findUnique({ where: { id: 1 } });
    const maxConsecutiveGames = settings?.maxConsecutiveGames ?? 2;

    const teams = await this.prisma.team.findMany({
      where: { sessionId },
    });

    const matchHistory = await this.prisma.match.findMany({
      where: {
        sessionId,
        events: { some: { type: 'MATCH_ENDED' } },
      },
      select: {
        teamAId: true,
        teamBId: true,
        winnerId: true,
        matchOrder: true,
      },
    });

    return getNextMatch(teams, matchHistory, maxConsecutiveGames);
  }
}

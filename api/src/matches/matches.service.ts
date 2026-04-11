import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartMatchDto } from './dto/start-match.dto';
import { RegisterGoalDto } from './dto/register-goal.dto';
import { EndMatchDto } from './dto/end-match.dto';
import { getNextMatch } from '../engines/match-rotation.engine';

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySession(sessionId: number, groupId: number) {
    // Verify session belongs to group
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });
    if (!session) {
      throw new NotFoundException(`Session #${sessionId} not found`);
    }

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

  async start(sessionId: number, dto: StartMatchDto, groupId: number) {
    // Verify session belongs to group
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });
    if (!session) {
      throw new NotFoundException(`Session #${sessionId} not found`);
    }

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

    if (session.status === 'PENDING') {
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

  async registerGoal(matchId: number, dto: RegisterGoalDto, groupId: number) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, session: { groupId } },
      include: { events: true },
    });

    if (!match) {
      throw new NotFoundException(`Match #${matchId} not found`);
    }

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

  async end(matchId: number, dto: EndMatchDto, groupId: number) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, session: { groupId } },
      include: {
        teamA: { include: { players: true } },
        teamB: { include: { players: true } },
        events: true,
      },
    });

    if (!match) {
      throw new NotFoundException(`Match #${matchId} not found`);
    }

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

  async undoGoal(matchId: number, goalId: number, groupId: number) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, session: { groupId } },
      include: { events: true },
    });

    if (!match) {
      throw new NotFoundException(`Match #${matchId} not found`);
    }

    const hasEnded = match.events.some((e) => e.type === 'MATCH_ENDED');
    if (hasEnded) {
      throw new BadRequestException('Cannot undo goal: match has already ended.');
    }

    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, matchId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal #${goalId} not found in match #${matchId}`);
    }

    const isTeamA = goal.teamId === match.teamAId;

    await this.prisma.$transaction(async (tx) => {
      await tx.goal.delete({ where: { id: goalId } });

      await tx.matchEvent.deleteMany({
        where: {
          matchId,
          type: 'GOAL_SCORED',
          payload: {
            path: ['playerId'],
            equals: goal.playerId,
          },
        },
      });

      await tx.match.update({
        where: { id: matchId },
        data: isTeamA ? { scoreA: { decrement: 1 } } : { scoreB: { decrement: 1 } },
      });

      await tx.player.update({
        where: { id: goal.playerId },
        data: { goals: { decrement: 1 } },
      });
    });

    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: { goals: true },
    });
  }

  async getNextMatch(sessionId: number, groupId: number) {
    // Verify session belongs to group
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });
    if (!session) {
      throw new NotFoundException(`Session #${sessionId} not found`);
    }

    const settings = await this.prisma.settings.findUnique({ where: { groupId } });
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

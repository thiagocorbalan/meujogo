import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartMatchDto } from './dto/start-match.dto';
import { RegisterGoalDto } from './dto/register-goal.dto';
import { EndMatchDto } from './dto/end-match.dto';
import { LateGoalDto } from './dto/late-goal.dto';
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
        matchPlayers: { include: { player: true } },
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

    return this.prisma.$transaction(async (tx) => {
      const count = await tx.match.count({ where: { sessionId } });

      const match = await tx.match.create({
        data: {
          sessionId,
          teamAId: dto.teamAId,
          teamBId: dto.teamBId,
          matchOrder: count + 1,
        },
      });

      await tx.matchEvent.create({
        data: {
          matchId: match.id,
          type: 'MATCH_STARTED',
        },
      });

      const teamPlayers = await tx.teamPlayer.findMany({
        where: { teamId: { in: [dto.teamAId, dto.teamBId] } },
      });

      const attendances = await tx.attendance.findMany({
        where: {
          sessionId,
          playerId: { in: teamPlayers.map((tp) => tp.playerId) },
          status: 'ATIVO',
        },
        select: { playerId: true },
      });
      const activeIds = new Set(attendances.map((a) => a.playerId));
      const activeTeamPlayers = teamPlayers.filter((tp) =>
        activeIds.has(tp.playerId),
      );

      await tx.matchPlayer.createMany({
        data: activeTeamPlayers.map((tp) => ({
          matchId: match.id,
          playerId: tp.playerId,
          teamId: tp.teamId,
          isStarter: true,
          enteredMinute: null,
        })),
      });

      return match;
    });
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

    const goal = await this.prisma.goal.create({
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
        goalId: goal.id,
        payload: {
          goalId: goal.id,
          playerId: dto.playerId,
          teamId: dto.teamId,
          minute: dto.minute ?? null,
        },
      },
    });

    const isTeamA = dto.teamId === match.teamAId;

    await this.prisma.match.update({
      where: { id: matchId },
      data: isTeamA
        ? { scoreA: { increment: 1 } }
        : { scoreB: { increment: 1 } },
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
      include: { events: true },
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

      if (
        winnerId &&
        winnerId !== match.teamAId &&
        winnerId !== match.teamBId
      ) {
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

    const matchPlayers = await this.prisma.matchPlayer.findMany({
      where: { matchId },
    });

    await Promise.all(
      matchPlayers.map((mp) =>
        this.prisma.player.update({
          where: { id: mp.playerId },
          data: { games: { increment: 1 } },
        }),
      ),
    );

    const tempSubs = await this.prisma.substitution.findMany({
      where: { matchId, type: 'TEMPORARIA', isReverted: false },
      select: { playerOutId: true, playerInId: true, sourceTeamId: true },
    });

    await this.prisma.substitution.updateMany({
      where: { matchId, type: 'TEMPORARIA', isReverted: false },
      data: { isReverted: true, revertedAt: new Date() },
    });

    for (const sub of tempSubs) {
      await this.prisma.attendance.updateMany({
        where: { sessionId: match.sessionId, playerId: sub.playerOutId },
        data: { status: 'ATIVO' },
      });
      await this.prisma.attendance.updateMany({
        where: { sessionId: match.sessionId, playerId: sub.playerInId },
        data: { status: sub.sourceTeamId === null ? 'RESERVA' : 'ATIVO' },
      });
    }

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
      throw new BadRequestException(
        'Cannot undo goal: match has already ended.',
      );
    }

    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, matchId },
    });

    if (!goal) {
      throw new NotFoundException(
        `Goal #${goalId} not found in match #${matchId}`,
      );
    }

    const isTeamA = goal.teamId === match.teamAId;
    const currentScore = isTeamA ? match.scoreA : match.scoreB;

    if (currentScore <= 0) {
      throw new BadRequestException('Score cannot become negative.');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.matchEvent.deleteMany({
        where: { matchId, goalId },
      });

      await tx.goal.delete({ where: { id: goalId } });

      await tx.match.update({
        where: { id: matchId },
        data: isTeamA
          ? { scoreA: { decrement: 1 } }
          : { scoreB: { decrement: 1 } },
      });

      if (goal.playerId !== null) {
        await tx.player.update({
          where: { id: goal.playerId },
          data: { goals: { decrement: 1 } },
        });
      }
    });

    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: { goals: true },
    });
  }

  async registerLateGoal(matchId: number, dto: LateGoalDto, groupId: number) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, session: { groupId } },
      include: { events: true, session: true },
    });

    if (!match) {
      throw new NotFoundException(`Match #${matchId} not found`);
    }

    const hasEnded = match.events.some((e) => e.type === 'MATCH_ENDED');
    if (!hasEnded) {
      throw new BadRequestException(
        'Cannot register late goal: match has not ended yet.',
      );
    }

    if (match.session.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Cannot register late goal: session is not in progress.',
      );
    }

    if (dto.teamId !== match.teamAId && dto.teamId !== match.teamBId) {
      throw new BadRequestException(
        'teamId must be one of the two teams in this match.',
      );
    }

    const isTeamA = dto.teamId === match.teamAId;

    await this.prisma.$transaction(async (tx) => {
      const goal = await tx.goal.create({
        data: {
          matchId,
          teamId: dto.teamId,
          playerId: null,
          source: 'LATE',
          minute: null,
        },
      });

      await tx.matchEvent.create({
        data: {
          matchId,
          type: 'LATE_GOAL_ADDED',
          goalId: goal.id,
          payload: {
            goalId: goal.id,
            teamId: dto.teamId,
            reason: dto.reason ?? null,
          },
        },
      });

      await tx.match.update({
        where: { id: matchId },
        data: isTeamA
          ? { scoreA: { increment: 1 } }
          : { scoreB: { increment: 1 } },
      });
    });

    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: { goals: true },
    });
  }

  async undoLateGoal(matchId: number, goalId: number, groupId: number) {
    const match = await this.prisma.match.findFirst({
      where: { id: matchId, session: { groupId } },
      include: { events: true, session: true },
    });

    if (!match) {
      throw new NotFoundException(`Match #${matchId} not found`);
    }

    if (match.session.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Cannot undo late goal: session is not in progress.',
      );
    }

    const goal = await this.prisma.goal.findFirst({
      where: { id: goalId, matchId },
    });

    if (!goal) {
      throw new NotFoundException(
        `Goal #${goalId} not found in match #${matchId}`,
      );
    }

    if (goal.source !== 'LATE') {
      throw new BadRequestException(
        'Only late goals can be undone after match ended.',
      );
    }

    const isTeamA = goal.teamId === match.teamAId;

    await this.prisma.$transaction(async (tx) => {
      await tx.matchEvent.deleteMany({ where: { matchId, goalId } });
      await tx.goal.delete({ where: { id: goalId } });
      await tx.match.update({
        where: { id: matchId },
        data: isTeamA
          ? { scoreA: { decrement: 1 } }
          : { scoreB: { decrement: 1 } },
      });
      await tx.matchEvent.create({
        data: {
          matchId,
          type: 'LATE_GOAL_REMOVED',
          payload: { goalId, teamId: goal.teamId },
        },
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

    const settings = await this.prisma.settings.findUnique({
      where: { groupId },
    });
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

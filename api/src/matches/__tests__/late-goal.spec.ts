import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { MatchesService } from '../matches.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type MockTx = {
  goal: { create: jest.Mock; findFirst: jest.Mock; delete: jest.Mock };
  matchEvent: { create: jest.Mock; deleteMany: jest.Mock };
  match: { update: jest.Mock; findFirst: jest.Mock };
  session: { findFirst: jest.Mock };
};

describe('MatchesService late goal', () => {
  let service: MatchesService;
  let prisma: {
    match: { findFirst: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    goal: { findFirst: jest.Mock; create: jest.Mock };
    matchEvent: { create: jest.Mock };
    session: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let mockTx: MockTx;

  const groupId = 1;
  const matchId = 10;

  const endedMatch = {
    id: matchId,
    sessionId: 55,
    teamAId: 1,
    teamBId: 2,
    scoreA: 2,
    scoreB: 1,
    winnerId: 1,
    isDraw: false,
    events: [{ type: 'MATCH_STARTED' }, { type: 'MATCH_ENDED' }],
    session: { id: 55, status: 'IN_PROGRESS', groupId },
  };

  beforeEach(async () => {
    mockTx = {
      goal: {
        create: jest.fn().mockResolvedValue({
          id: 500,
          matchId,
          playerId: null,
          teamId: 1,
          source: 'LATE',
          minute: null,
        }),
        findFirst: jest.fn(),
        delete: jest.fn(),
      },
      matchEvent: {
        create: jest.fn(),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      match: {
        update: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(endedMatch),
      },
      session: {
        findFirst: jest.fn().mockResolvedValue({ status: 'IN_PROGRESS' }),
      },
    };

    prisma = {
      match: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ ...endedMatch, goals: [] }),
        update: jest.fn(),
      },
      goal: { findFirst: jest.fn(), create: jest.fn() },
      matchEvent: { create: jest.fn() },
      session: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: (tx: MockTx) => Promise<void>) => cb(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('registerLateGoal', () => {
    it('creates Goal with source=LATE and playerId=null', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);

      await service.registerLateGoal(matchId, { teamId: 1 }, groupId);

      expect(mockTx.goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          matchId,
          teamId: 1,
          source: 'LATE',
          playerId: null,
        }),
      });
    });

    it('creates MatchEvent LATE_GOAL_ADDED with goalId', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);

      await service.registerLateGoal(matchId, { teamId: 1 }, groupId);

      expect(mockTx.matchEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          matchId,
          type: 'LATE_GOAL_ADDED',
          goalId: 500,
        }),
      });
    });

    it('increments scoreA when teamId is team A', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);

      await service.registerLateGoal(matchId, { teamId: 1 }, groupId);

      expect(mockTx.match.update).toHaveBeenCalledWith({
        where: { id: matchId },
        data: { scoreA: { increment: 1 } },
      });
    });

    it('increments scoreB when teamId is team B', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);

      await service.registerLateGoal(matchId, { teamId: 2 }, groupId);

      expect(mockTx.match.update).toHaveBeenCalledWith({
        where: { id: matchId },
        data: { scoreB: { increment: 1 } },
      });
    });

    it('does NOT alter winnerId or isDraw', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);

      await service.registerLateGoal(matchId, { teamId: 2 }, groupId);

      const updateCall = mockTx.match.update.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty('winnerId');
      expect(updateCall.data).not.toHaveProperty('isDraw');
    });

    it('rejects when match is still active (no MATCH_ENDED event)', async () => {
      prisma.match.findFirst.mockResolvedValue({
        ...endedMatch,
        events: [{ type: 'MATCH_STARTED' }],
      });

      await expect(
        service.registerLateGoal(matchId, { teamId: 1 }, groupId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when session status is FINISHED', async () => {
      prisma.match.findFirst.mockResolvedValue({
        ...endedMatch,
        session: { id: 55, status: 'FINISHED', groupId },
      });

      await expect(
        service.registerLateGoal(matchId, { teamId: 1 }, groupId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when teamId is not one of the match teams', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);

      await expect(
        service.registerLateGoal(matchId, { teamId: 999 }, groupId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects with NotFound when match does not belong to group', async () => {
      prisma.match.findFirst.mockResolvedValue(null);

      await expect(
        service.registerLateGoal(matchId, { teamId: 1 }, groupId),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('runs all writes inside a single $transaction for atomicity', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);

      await service.registerLateGoal(matchId, { teamId: 1 }, groupId);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('undoLateGoal', () => {
    it('rejects when goal source is not LATE', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);
      prisma.goal.findFirst.mockResolvedValue({
        id: 77,
        matchId,
        playerId: 5,
        teamId: 1,
        source: 'LIVE',
      });

      await expect(
        service.undoLateGoal(matchId, 77, groupId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('deletes Goal, deletes events by goalId, decrements score, creates LATE_GOAL_REMOVED', async () => {
      prisma.match.findFirst.mockResolvedValue(endedMatch);
      prisma.goal.findFirst.mockResolvedValue({
        id: 500,
        matchId,
        playerId: null,
        teamId: 1,
        source: 'LATE',
      });

      await service.undoLateGoal(matchId, 500, groupId);

      expect(mockTx.goal.delete).toHaveBeenCalledWith({ where: { id: 500 } });
      expect(mockTx.matchEvent.deleteMany).toHaveBeenCalledWith({
        where: { matchId, goalId: 500 },
      });
      expect(mockTx.match.update).toHaveBeenCalledWith({
        where: { id: matchId },
        data: { scoreA: { decrement: 1 } },
      });
      expect(mockTx.matchEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ matchId, type: 'LATE_GOAL_REMOVED' }),
      });
    });

    it('rejects when session status is FINISHED', async () => {
      prisma.match.findFirst.mockResolvedValue({
        ...endedMatch,
        session: { id: 55, status: 'FINISHED', groupId },
      });
      prisma.goal.findFirst.mockResolvedValue({
        id: 500,
        matchId,
        playerId: null,
        teamId: 1,
        source: 'LATE',
      });

      await expect(
        service.undoLateGoal(matchId, 500, groupId),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

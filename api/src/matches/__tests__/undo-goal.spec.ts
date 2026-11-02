import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { MatchesService } from '../matches.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type MockTx = {
  goal: { delete: jest.Mock };
  matchEvent: { deleteMany: jest.Mock; create: jest.Mock };
  match: { update: jest.Mock; findUnique: jest.Mock };
  player: { update: jest.Mock };
};

describe('MatchesService.undoGoal', () => {
  let service: MatchesService;
  let prisma: {
    match: { findFirst: jest.Mock; findUnique: jest.Mock };
    goal: { findFirst: jest.Mock };
    $transaction: jest.Mock;
  };
  let mockTx: MockTx;

  const groupId = 1;
  const matchId = 10;
  const goalId = 100;

  beforeEach(async () => {
    mockTx = {
      goal: { delete: jest.fn() },
      matchEvent: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn(),
      },
      match: { update: jest.fn(), findUnique: jest.fn() },
      player: { update: jest.fn() },
    };

    prisma = {
      match: {
        findFirst: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({ id: matchId, goals: [] }),
      },
      goal: { findFirst: jest.fn() },
      $transaction: jest.fn((cb: (tx: MockTx) => Promise<void>) => cb(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('throws NotFoundException when match does not belong to group', async () => {
    prisma.match.findFirst.mockResolvedValue(null);

    await expect(
      service.undoGoal(matchId, goalId, groupId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException when match has already ended', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 1,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }, { type: 'MATCH_ENDED' }],
    });

    await expect(
      service.undoGoal(matchId, goalId, groupId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws NotFoundException when goal does not exist in match', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 1,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue(null);

    await expect(
      service.undoGoal(matchId, goalId, groupId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when score would become negative', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 0,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: 5,
      teamId: 1,
      source: 'LIVE',
    });

    await expect(
      service.undoGoal(matchId, goalId, groupId),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deletes matchEvent filtering by goalId, not by payload.playerId', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 3,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: 5,
      teamId: 1,
      source: 'LIVE',
    });

    await service.undoGoal(matchId, goalId, groupId);

    expect(mockTx.matchEvent.deleteMany).toHaveBeenCalledWith({
      where: { matchId, goalId },
    });

    const callArg = mockTx.matchEvent.deleteMany.mock.calls[0][0];
    expect(callArg.where).not.toHaveProperty('payload');
    expect(callArg.where).not.toHaveProperty('type');
  });

  it('deletes only the specific goal (not by playerId)', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 3,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: 5,
      teamId: 1,
      source: 'LIVE',
    });

    await service.undoGoal(matchId, goalId, groupId);

    expect(mockTx.goal.delete).toHaveBeenCalledWith({ where: { id: goalId } });
  });

  it('decrements scoreA when goal belongs to team A', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 2,
      scoreB: 1,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: 5,
      teamId: 1,
      source: 'LIVE',
    });

    await service.undoGoal(matchId, goalId, groupId);

    expect(mockTx.match.update).toHaveBeenCalledWith({
      where: { id: matchId },
      data: { scoreA: { decrement: 1 } },
    });
  });

  it('decrements scoreB when goal belongs to team B', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 1,
      scoreB: 2,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: 7,
      teamId: 2,
      source: 'LIVE',
    });

    await service.undoGoal(matchId, goalId, groupId);

    expect(mockTx.match.update).toHaveBeenCalledWith({
      where: { id: matchId },
      data: { scoreB: { decrement: 1 } },
    });
  });

  it('decrements player.goals for the scorer', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 2,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: 5,
      teamId: 1,
      source: 'LIVE',
    });

    await service.undoGoal(matchId, goalId, groupId);

    expect(mockTx.player.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { goals: { decrement: 1 } },
    });
  });

  it('does not touch player.goals when goal has null playerId (late goal)', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 2,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: null,
      teamId: 1,
      source: 'LATE',
    });

    await service.undoGoal(matchId, goalId, groupId);

    expect(mockTx.player.update).not.toHaveBeenCalled();
  });

  it('runs all writes inside a single $transaction for atomicity', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 2,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: goalId,
      matchId,
      playerId: 5,
      teamId: 1,
      source: 'LIVE',
    });

    await service.undoGoal(matchId, goalId, groupId);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('allows undoing any goal (not just the last one)', async () => {
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      teamAId: 1,
      teamBId: 2,
      scoreA: 3,
      scoreB: 0,
      events: [{ type: 'MATCH_STARTED' }],
    });
    prisma.goal.findFirst.mockResolvedValue({
      id: 99,
      matchId,
      playerId: 5,
      teamId: 1,
      source: 'LIVE',
    });

    await expect(service.undoGoal(matchId, 99, groupId)).resolves.toBeDefined();
    expect(mockTx.goal.delete).toHaveBeenCalledWith({ where: { id: 99 } });
  });
});

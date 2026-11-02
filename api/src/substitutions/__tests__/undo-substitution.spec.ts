import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SubstitutionsService } from '../substitutions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type MockTx = {
  substitution: { update: jest.Mock };
  matchPlayer: {
    delete: jest.Mock;
    deleteMany: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  teamPlayer: { delete: jest.Mock; deleteMany: jest.Mock; create: jest.Mock };
  attendance: { updateMany: jest.Mock };
  matchEvent: { create: jest.Mock };
};

describe('SubstitutionsService.undo', () => {
  let service: SubstitutionsService;
  let prisma: {
    session: { findFirst: jest.Mock };
    substitution: { findFirst: jest.Mock };
    match: { findFirst: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let mockTx: MockTx;

  const groupId = 1;
  const sessionId = 55;
  const substitutionId = 5000;
  const matchId = 999;
  const teamAId = 100;
  const playerOutId = 11;
  const playerInId = 77;

  beforeEach(async () => {
    mockTx = {
      substitution: { update: jest.fn() },
      matchPlayer: {
        delete: jest.fn(),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      teamPlayer: {
        delete: jest.fn(),
        deleteMany: jest.fn(),
        create: jest.fn(),
      },
      attendance: { updateMany: jest.fn() },
      matchEvent: { create: jest.fn() },
    };

    prisma = {
      session: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: sessionId, groupId, status: 'IN_PROGRESS' }),
      },
      substitution: { findFirst: jest.fn() },
      match: {
        findFirst: jest.fn().mockResolvedValue({
          id: matchId,
          sessionId,
          events: [{ type: 'MATCH_STARTED' }],
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn(async (cb: (tx: MockTx) => unknown) => cb(mockTx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubstitutionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubstitutionsService>(SubstitutionsService);
  });

  it('throws NotFoundException when session not found', async () => {
    prisma.session.findFirst.mockResolvedValue(null);
    await expect(
      service.undo(sessionId, substitutionId, groupId),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when substitution not found', async () => {
    prisma.substitution.findFirst.mockResolvedValue(null);
    await expect(
      service.undo(sessionId, substitutionId, groupId),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when substitution already reverted', async () => {
    prisma.substitution.findFirst.mockResolvedValue({
      id: substitutionId,
      sessionId,
      matchId,
      teamId: teamAId,
      sourceTeamId: null,
      playerOutId,
      playerInId,
      type: 'TEMPORARIA',
      reason: 'CANSACO',
      isReverted: true,
    });
    await expect(
      service.undo(sessionId, substitutionId, groupId),
    ).rejects.toThrow(BadRequestException);
  });

  it('undoes TEMPORARIA during active match: reverts MatchPlayer and restores attendance', async () => {
    prisma.substitution.findFirst.mockResolvedValue({
      id: substitutionId,
      sessionId,
      matchId,
      teamId: teamAId,
      sourceTeamId: null,
      playerOutId,
      playerInId,
      type: 'TEMPORARIA',
      reason: 'CANSACO',
      isReverted: false,
    });

    await service.undo(sessionId, substitutionId, groupId);

    expect(mockTx.matchPlayer.deleteMany).toHaveBeenCalledWith({
      where: { matchId, playerId: playerInId },
    });
    expect(mockTx.matchPlayer.updateMany).toHaveBeenCalledWith({
      where: { matchId, playerId: playerOutId },
      data: { leftMinute: null },
    });
    expect(mockTx.attendance.updateMany).toHaveBeenCalledWith({
      where: { sessionId, playerId: playerOutId },
      data: { status: 'ATIVO' },
    });
    expect(mockTx.substitution.update).toHaveBeenCalledWith({
      where: { id: substitutionId },
      data: { isReverted: true, revertedAt: expect.any(Date) },
    });
  });

  it('undoes PERMANENTE: reverts TeamPlayer and MatchPlayer', async () => {
    prisma.substitution.findFirst.mockResolvedValue({
      id: substitutionId,
      sessionId,
      matchId,
      teamId: teamAId,
      sourceTeamId: 200,
      playerOutId,
      playerInId,
      type: 'PERMANENTE',
      reason: 'LESAO',
      isReverted: false,
    });

    await service.undo(sessionId, substitutionId, groupId);

    expect(mockTx.teamPlayer.deleteMany).toHaveBeenCalledWith({
      where: { teamId: teamAId, playerId: playerInId },
    });
    expect(mockTx.teamPlayer.create).toHaveBeenCalledWith({
      data: { teamId: teamAId, playerId: playerOutId },
    });
    expect(mockTx.substitution.update).toHaveBeenCalled();
  });

  it('rejects undo of PERMANENTE when later matches were already played', async () => {
    prisma.substitution.findFirst.mockResolvedValue({
      id: substitutionId,
      sessionId,
      matchId,
      teamId: teamAId,
      sourceTeamId: null,
      playerOutId,
      playerInId,
      type: 'PERMANENTE',
      reason: 'LESAO',
      isReverted: false,
    });
    prisma.match.findFirst.mockResolvedValue({
      id: matchId,
      sessionId,
      matchOrder: 2,
      events: [{ type: 'MATCH_STARTED' }, { type: 'MATCH_ENDED' }],
    });
    prisma.match.findMany.mockResolvedValue([
      { id: matchId + 1, matchOrder: 3, events: [{ type: 'MATCH_STARTED' }] },
    ]);

    await expect(
      service.undo(sessionId, substitutionId, groupId),
    ).rejects.toThrow(BadRequestException);
  });
});

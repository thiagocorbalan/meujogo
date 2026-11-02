import { Test, type TestingModule } from '@nestjs/testing';
import { MatchesService } from '../matches.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('MatchesService.end using MatchPlayer for games counter', () => {
  let service: MatchesService;
  let prisma: {
    match: { findFirst: jest.Mock; update: jest.Mock };
    matchEvent: { create: jest.Mock };
    matchPlayer: { findMany: jest.Mock };
    player: { update: jest.Mock };
    teamPlayer: { findMany: jest.Mock };
    substitution: { updateMany: jest.Mock; findMany: jest.Mock };
    attendance: { updateMany: jest.Mock };
  };

  const groupId = 1;
  const matchId = 10;
  const teamAId = 100;
  const teamBId = 200;

  const matchRecord = {
    id: matchId,
    teamAId,
    teamBId,
    scoreA: 2,
    scoreB: 1,
    matchOrder: 2,
    isDraw: false,
    events: [{ type: 'MATCH_STARTED' }],
    teamA: { id: teamAId, players: [] },
    teamB: { id: teamBId, players: [] },
  };

  beforeEach(async () => {
    prisma = {
      match: {
        findFirst: jest.fn().mockResolvedValue(matchRecord),
        update: jest
          .fn()
          .mockResolvedValue({ ...matchRecord, winnerId: teamAId }),
      },
      matchEvent: { create: jest.fn() },
      matchPlayer: {
        findMany: jest.fn().mockResolvedValue([
          { matchId, teamId: teamAId, playerId: 11 },
          { matchId, teamId: teamAId, playerId: 12 },
          { matchId, teamId: teamBId, playerId: 21 },
          { matchId, teamId: teamBId, playerId: 22 },
          { matchId, teamId: teamBId, playerId: 99 },
        ]),
      },
      player: { update: jest.fn().mockResolvedValue({}) },
      teamPlayer: { findMany: jest.fn() },
      substitution: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      attendance: { updateMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it('increments games for every player listed in MatchPlayer for this match', async () => {
    await service.end(matchId, {}, groupId);

    expect(prisma.matchPlayer.findMany).toHaveBeenCalledWith({
      where: { matchId },
    });
    const playerIds = prisma.player.update.mock.calls.map(
      (
        call: [
          { where: { id: number }; data: { games: { increment: number } } },
        ],
      ) => call[0].where.id,
    );
    expect(playerIds.sort()).toEqual([11, 12, 21, 22, 99]);
    prisma.player.update.mock.calls.forEach((call) => {
      expect(call[0]).toEqual({
        where: { id: expect.any(Number) },
        data: { games: { increment: 1 } },
      });
    });
  });

  it('does NOT use TeamPlayer to compute the games counter', async () => {
    await service.end(matchId, {}, groupId);
    expect(prisma.teamPlayer.findMany).not.toHaveBeenCalled();
  });

  it('counts a substituted-in player who joined mid-match (present in MatchPlayer but not in TeamPlayer)', async () => {
    await service.end(matchId, {}, groupId);
    const playerIds = prisma.player.update.mock.calls.map(
      (call: [{ where: { id: number } }]) => call[0].where.id,
    );
    expect(playerIds).toContain(99);
  });
});

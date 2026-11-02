import { Test, type TestingModule } from '@nestjs/testing';
import { MatchesService } from '../../matches/matches.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('revertTemporarySubstitutions on match end', () => {
  let service: MatchesService;
  let prisma: {
    match: { findFirst: jest.Mock; update: jest.Mock };
    matchEvent: { create: jest.Mock };
    matchPlayer: {
      findMany: jest.Mock;
      deleteMany: jest.Mock;
      updateMany: jest.Mock;
    };
    substitution: { findMany: jest.Mock; updateMany: jest.Mock };
    player: { update: jest.Mock };
    attendance: { updateMany: jest.Mock };
  };

  const groupId = 1;
  const matchId = 999;
  const teamAId = 100;

  beforeEach(async () => {
    prisma = {
      match: {
        findFirst: jest.fn().mockResolvedValue({
          id: matchId,
          sessionId: 55,
          teamAId,
          teamBId: 200,
          scoreA: 2,
          scoreB: 1,
          matchOrder: 2,
          isDraw: false,
          events: [{ type: 'MATCH_STARTED' }],
        }),
        update: jest.fn().mockResolvedValue({ id: matchId, winnerId: teamAId }),
      },
      matchEvent: { create: jest.fn() },
      matchPlayer: {
        findMany: jest.fn().mockResolvedValue([
          { matchId, teamId: teamAId, playerId: 11 },
          { matchId, teamId: teamAId, playerId: 99 },
          { matchId, teamId: 200, playerId: 21 },
        ]),
        deleteMany: jest.fn(),
        updateMany: jest.fn(),
      },
      substitution: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 5000,
            sessionId: 55,
            matchId,
            type: 'TEMPORARIA',
            teamId: teamAId,
            sourceTeamId: null,
            playerOutId: 11,
            playerInId: 99,
            isReverted: false,
          },
        ]),
        updateMany: jest.fn(),
      },
      player: { update: jest.fn().mockResolvedValue({}) },
      attendance: { updateMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it('marks all TEMPORARIA substitutions for the match as reverted', async () => {
    await service.end(matchId, {}, groupId);

    expect(prisma.substitution.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          matchId,
          type: 'TEMPORARIA',
          isReverted: false,
        }),
        data: expect.objectContaining({
          isReverted: true,
          revertedAt: expect.any(Date),
        }),
      }),
    );
  });
});

import { Test, type TestingModule } from '@nestjs/testing';
import { MatchesService } from '../matches.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type MockTx = {
  match: { create: jest.Mock; count: jest.Mock };
  matchEvent: { create: jest.Mock };
  matchPlayer: { createMany: jest.Mock };
  session: { update: jest.Mock };
  team: { findUnique: jest.Mock };
  teamPlayer: { findMany: jest.Mock };
  attendance: { findMany: jest.Mock };
};

describe('MatchesService.start populating MatchPlayer', () => {
  let service: MatchesService;
  let prisma: {
    session: { findFirst: jest.Mock; update: jest.Mock };
    match: { findFirst: jest.Mock; create: jest.Mock; count: jest.Mock };
    matchEvent: { create: jest.Mock };
    matchPlayer: { createMany: jest.Mock };
    teamPlayer: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let mockTx: MockTx;

  const groupId = 1;
  const sessionId = 55;
  const teamAId = 100;
  const teamBId = 200;
  const createdMatchId = 999;

  const teamAPlayers = [
    { id: 1, teamId: teamAId, playerId: 11 },
    { id: 2, teamId: teamAId, playerId: 12 },
    { id: 3, teamId: teamAId, playerId: 13 },
  ];

  const teamBPlayers = [
    { id: 4, teamId: teamBId, playerId: 21 },
    { id: 5, teamId: teamBId, playerId: 22 },
    { id: 6, teamId: teamBId, playerId: 23 },
  ];

  beforeEach(async () => {
    mockTx = {
      match: {
        create: jest.fn().mockResolvedValue({
          id: createdMatchId,
          sessionId,
          teamAId,
          teamBId,
          matchOrder: 1,
        }),
        count: jest.fn().mockResolvedValue(0),
      },
      matchEvent: { create: jest.fn() },
      matchPlayer: { createMany: jest.fn().mockResolvedValue({ count: 6 }) },
      session: { update: jest.fn() },
      team: { findUnique: jest.fn() },
      teamPlayer: {
        findMany: jest
          .fn()
          .mockImplementation(
            ({ where }: { where: { teamId: { in: number[] } } }) => {
              const ids = where.teamId.in;
              const out: { id: number; teamId: number; playerId: number }[] =
                [];
              if (ids.includes(teamAId)) out.push(...teamAPlayers);
              if (ids.includes(teamBId)) out.push(...teamBPlayers);
              return Promise.resolve(out);
            },
          ),
      },
      attendance: {
        findMany: jest.fn().mockImplementation(
          ({
            where,
          }: {
            where: { playerId: { in: number[] }; status: string };
          }) => {
            return Promise.resolve(
              where.playerId.in.map((id) => ({ playerId: id, status: 'ATIVO' })),
            );
          },
        ),
      },
    };

    prisma = {
      session: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: sessionId, groupId, status: 'IN_PROGRESS' }),
        update: jest.fn(),
      },
      match: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        count: jest.fn(),
      },
      matchEvent: { create: jest.fn() },
      matchPlayer: { createMany: jest.fn() },
      teamPlayer: { findMany: jest.fn() },
      $transaction: jest.fn((cb: (tx: MockTx) => Promise<unknown>) =>
        cb(mockTx),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MatchesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  it('creates MatchPlayer rows for all TeamPlayers of both teams', async () => {
    await service.start(sessionId, { teamAId, teamBId }, groupId);

    expect(mockTx.matchPlayer.createMany).toHaveBeenCalledTimes(1);
    const arg = mockTx.matchPlayer.createMany.mock.calls[0][0] as {
      data: Array<{
        matchId: number;
        playerId: number;
        teamId: number;
        isStarter: boolean;
        enteredMinute: number | null;
      }>;
    };
    expect(arg.data).toHaveLength(6);
    expect(arg.data.every((row) => row.matchId === createdMatchId)).toBe(true);
    expect(arg.data.every((row) => row.isStarter === true)).toBe(true);
    expect(arg.data.every((row) => row.enteredMinute === null)).toBe(true);

    const teamAEntries = arg.data.filter((row) => row.teamId === teamAId);
    const teamBEntries = arg.data.filter((row) => row.teamId === teamBId);
    expect(teamAEntries.map((r) => r.playerId).sort()).toEqual([11, 12, 13]);
    expect(teamBEntries.map((r) => r.playerId).sort()).toEqual([21, 22, 23]);
  });

  it('queries TeamPlayer for both teams in a single call', async () => {
    await service.start(sessionId, { teamAId, teamBId }, groupId);

    expect(mockTx.teamPlayer.findMany).toHaveBeenCalledTimes(1);
    const findArg = mockTx.teamPlayer.findMany.mock.calls[0][0] as {
      where: { teamId: { in: number[] } };
    };
    expect(findArg.where.teamId.in.sort()).toEqual([teamAId, teamBId].sort());
  });

  it('creates Match, MatchEvent and MatchPlayer atomically inside a transaction', async () => {
    await service.start(sessionId, { teamAId, teamBId }, groupId);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockTx.match.create).toHaveBeenCalledTimes(1);
    expect(mockTx.matchEvent.create).toHaveBeenCalledTimes(1);
    expect(mockTx.matchPlayer.createMany).toHaveBeenCalledTimes(1);
  });

  it('returns the created match', async () => {
    const result = await service.start(
      sessionId,
      { teamAId, teamBId },
      groupId,
    );
    expect(result).toMatchObject({ id: createdMatchId, teamAId, teamBId });
  });

  it('skips TeamPlayers whose attendance is not ATIVO (e.g. stale RESERVA)', async () => {
    mockTx.attendance.findMany.mockImplementation(
      ({
        where,
      }: {
        where: {
          sessionId: number;
          playerId: { in: number[] };
          status: string;
        };
      }) => {
        const all = [
          { playerId: 11, status: 'ATIVO' },
          { playerId: 12, status: 'RESERVA' },
          { playerId: 13, status: 'LESIONADO' },
          { playerId: 21, status: 'ATIVO' },
          { playerId: 22, status: 'AUSENTE' },
          { playerId: 23, status: 'ATIVO' },
        ];
        return Promise.resolve(
          all.filter(
            (a) =>
              a.status === where.status &&
              where.playerId.in.includes(a.playerId),
          ),
        );
      },
    );

    await service.start(sessionId, { teamAId, teamBId }, groupId);

    const arg = mockTx.matchPlayer.createMany.mock.calls[0][0] as {
      data: Array<{ playerId: number }>;
    };
    const createdIds = arg.data.map((r) => r.playerId).sort();
    expect(createdIds).toEqual([11, 21, 23]);
  });
});

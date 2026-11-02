import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { SubstitutionsService } from '../substitutions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

type MockTx = {
  substitution: { create: jest.Mock };
  matchPlayer: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  teamPlayer: {
    findFirst: jest.Mock;
    delete: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  attendance: {
    update: jest.Mock;
    updateMany: jest.Mock;
    findFirst: jest.Mock;
  };
  matchEvent: { create: jest.Mock };
};

describe('SubstitutionsService.create', () => {
  let service: SubstitutionsService;
  let prisma: {
    session: { findFirst: jest.Mock };
    match: { findFirst: jest.Mock };
    team: { findFirst: jest.Mock; findMany: jest.Mock };
    teamPlayer: { findFirst: jest.Mock; findMany: jest.Mock };
    attendance: { findFirst: jest.Mock };
    matchPlayer: { findFirst: jest.Mock; findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let mockTx: MockTx;

  const groupId = 1;
  const sessionId = 55;
  const teamAId = 100;
  const teamBId = 200;
  const teamCId = 300;
  const matchId = 999;

  const playerOutId = 11;
  const playerInReserveId = 77;
  const playerInOtherTeamId = 88;
  const playerInActiveTeamId = 22;

  const activeMatch = {
    id: matchId,
    sessionId,
    teamAId,
    teamBId,
    events: [{ type: 'MATCH_STARTED' }],
  };

  const sessionInProgress = {
    id: sessionId,
    groupId,
    status: 'IN_PROGRESS' as const,
  };

  beforeEach(async () => {
    mockTx = {
      substitution: {
        create: jest
          .fn()
          .mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({ id: 5000, ...data }),
          ),
      },
      matchPlayer: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      teamPlayer: {
        findFirst: jest.fn(),
        delete: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      attendance: {
        update: jest.fn(),
        updateMany: jest.fn(),
        findFirst: jest.fn(),
      },
      matchEvent: { create: jest.fn() },
    };

    prisma = {
      session: { findFirst: jest.fn().mockResolvedValue(sessionInProgress) },
      match: { findFirst: jest.fn().mockResolvedValue(activeMatch) },
      team: {
        findFirst: jest.fn().mockResolvedValue({ id: teamAId, sessionId }),
        findMany: jest.fn().mockResolvedValue([
          { id: teamAId, sessionId },
          { id: teamBId, sessionId },
          { id: teamCId, sessionId },
        ]),
      },
      teamPlayer: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      attendance: {
        findFirst: jest.fn().mockResolvedValue({
          id: 700,
          sessionId,
          playerId: playerInReserveId,
          status: 'RESERVA',
        }),
      },
      matchPlayer: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((cb: (tx: MockTx) => Promise<unknown>) =>
        cb(mockTx),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubstitutionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubstitutionsService>(SubstitutionsService);
  });

  describe('TEMPORARIA during active match', () => {
    beforeEach(() => {
      prisma.attendance.findFirst.mockResolvedValue({
        id: 700,
        sessionId,
        playerId: playerInReserveId,
        status: 'RESERVA',
      });
      prisma.teamPlayer.findFirst.mockResolvedValue(null);
    });

    it('creates Substitution with type TEMPORARIA, matchId and minute', async () => {
      await service.create(
        sessionId,
        {
          type: 'TEMPORARIA',
          reason: 'CANSACO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId,
          minute: 7,
        },
        groupId,
      );

      expect(mockTx.substitution.create).toHaveBeenCalledTimes(1);
      const arg = mockTx.substitution.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(arg.data).toMatchObject({
        sessionId,
        matchId,
        teamId: teamAId,
        playerOutId,
        playerInId: playerInReserveId,
        type: 'TEMPORARIA',
        reason: 'CANSACO',
        minute: 7,
      });
    });

    it('updates MatchPlayer (leftMinute on outgoing, creates entry for incoming)', async () => {
      await service.create(
        sessionId,
        {
          type: 'TEMPORARIA',
          reason: 'CANSACO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId,
          minute: 7,
        },
        groupId,
      );

      expect(mockTx.matchPlayer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { matchId, playerId: playerOutId },
          data: { leftMinute: 7 },
        }),
      );
      expect(mockTx.matchPlayer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            matchId,
            playerId: playerInReserveId,
            teamId: teamAId,
            isStarter: false,
            enteredMinute: 7,
          }),
        }),
      );
    });

    it('does NOT modify TeamPlayer for TEMPORARIA', async () => {
      await service.create(
        sessionId,
        {
          type: 'TEMPORARIA',
          reason: 'CANSACO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId,
          minute: 5,
        },
        groupId,
      );

      expect(mockTx.teamPlayer.delete).not.toHaveBeenCalled();
      expect(mockTx.teamPlayer.create).not.toHaveBeenCalled();
    });

    it('creates a PLAYER_SUBSTITUTED MatchEvent', async () => {
      await service.create(
        sessionId,
        {
          type: 'TEMPORARIA',
          reason: 'CANSACO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId,
          minute: 5,
        },
        groupId,
      );

      expect(mockTx.matchEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            matchId,
            type: 'PLAYER_SUBSTITUTED',
          }),
        }),
      );
    });

    it('updates attendance: outgoing CANSACO -> RESERVA, incoming -> ATIVO', async () => {
      await service.create(
        sessionId,
        {
          type: 'TEMPORARIA',
          reason: 'CANSACO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId,
          minute: 5,
        },
        groupId,
      );

      const updateCalls = mockTx.attendance.updateMany.mock.calls.map(
        (
          c: [
            {
              where: { sessionId: number; playerId: number };
              data: { status: string };
            },
          ],
        ) => c[0],
      );
      const outCall = updateCalls.find((c) => c.where.playerId === playerOutId);
      const inCall = updateCalls.find(
        (c) => c.where.playerId === playerInReserveId,
      );
      expect(outCall?.data.status).toBe('RESERVA');
      expect(inCall?.data.status).toBe('ATIVO');
    });
  });

  describe('PERMANENTE during active match', () => {
    beforeEach(() => {
      prisma.attendance.findFirst.mockResolvedValue({
        id: 700,
        sessionId,
        playerId: playerInReserveId,
        status: 'RESERVA',
      });
      prisma.teamPlayer.findFirst.mockResolvedValue(null);
    });

    it('updates MatchPlayer AND TeamPlayer', async () => {
      await service.create(
        sessionId,
        {
          type: 'PERMANENTE',
          reason: 'LESAO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId,
          minute: 12,
        },
        groupId,
      );

      expect(mockTx.matchPlayer.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { matchId, playerId: playerOutId },
          data: { leftMinute: 12 },
        }),
      );
      expect(mockTx.matchPlayer.create).toHaveBeenCalled();

      expect(mockTx.teamPlayer.deleteMany).toHaveBeenCalledWith({
        where: { teamId: teamAId, playerId: playerOutId },
      });
      expect(mockTx.teamPlayer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { teamId: teamAId, playerId: playerInReserveId },
        }),
      );
    });

    it('outgoing player by LESAO becomes LESIONADO', async () => {
      await service.create(
        sessionId,
        {
          type: 'PERMANENTE',
          reason: 'LESAO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId,
          minute: 9,
        },
        groupId,
      );

      const updateCalls = mockTx.attendance.updateMany.mock.calls.map(
        (
          c: [
            {
              where: { sessionId: number; playerId: number };
              data: { status: string };
            },
          ],
        ) => c[0],
      );
      const outCall = updateCalls.find((c) => c.where.playerId === playerOutId);
      expect(outCall?.data.status).toBe('LESIONADO');
    });
  });

  describe('PERMANENTE between matches (matchId=null)', () => {
    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue(null);
      prisma.attendance.findFirst.mockResolvedValue({
        id: 700,
        sessionId,
        playerId: playerInReserveId,
        status: 'RESERVA',
      });
      prisma.teamPlayer.findFirst.mockResolvedValue(null);
    });

    it('updates only TeamPlayer, no MatchPlayer or MatchEvent', async () => {
      await service.create(
        sessionId,
        {
          type: 'PERMANENTE',
          reason: 'LESAO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInReserveId,
          matchId: null,
        },
        groupId,
      );

      expect(mockTx.teamPlayer.deleteMany).toHaveBeenCalledWith({
        where: { teamId: teamAId, playerId: playerOutId },
      });
      expect(mockTx.teamPlayer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { teamId: teamAId, playerId: playerInReserveId },
        }),
      );
      expect(mockTx.matchPlayer.create).not.toHaveBeenCalled();
      expect(mockTx.matchPlayer.updateMany).not.toHaveBeenCalled();
      expect(mockTx.matchEvent.create).not.toHaveBeenCalled();
    });
  });

  describe('TEMPORARIA between matches', () => {
    it('rejects with BadRequestException', async () => {
      prisma.match.findFirst.mockResolvedValue(null);

      await expect(
        service.create(
          sessionId,
          {
            type: 'TEMPORARIA',
            reason: 'CANSACO',
            teamId: teamAId,
            playerOutId,
            playerInId: playerInReserveId,
            matchId: null,
          },
          groupId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('cross-team scenarios (3+ teams)', () => {
    beforeEach(() => {
      prisma.attendance.findFirst.mockResolvedValue({
        id: 701,
        sessionId,
        playerId: playerInOtherTeamId,
        status: 'ATIVO',
      });
      prisma.teamPlayer.findFirst.mockImplementation(
        ({
          where,
        }: {
          where: {
            playerId: number;
            teamId?: { in?: number[] };
            team?: { sessionId?: number };
          };
        }) => {
          if (where.playerId !== playerInOtherTeamId)
            return Promise.resolve(null);
          if (where.teamId?.in) {
            if (where.teamId.in.includes(teamCId)) {
              return Promise.resolve({
                id: 9,
                teamId: teamCId,
                playerId: playerInOtherTeamId,
              });
            }
            return Promise.resolve(null);
          }
          return Promise.resolve({
            id: 9,
            teamId: teamCId,
            playerId: playerInOtherTeamId,
          });
        },
      );
    });

    it('accepts playerIn from a team NOT in the active match and fills sourceTeamId', async () => {
      await service.create(
        sessionId,
        {
          type: 'PERMANENTE',
          reason: 'LESAO',
          teamId: teamAId,
          playerOutId,
          playerInId: playerInOtherTeamId,
          matchId,
          minute: 8,
        },
        groupId,
      );

      const createArg = mockTx.substitution.create.mock.calls[0][0] as {
        data: Record<string, unknown>;
      };
      expect(createArg.data.sourceTeamId).toBe(teamCId);
    });
  });

  describe('rejection: playerIn already in active match teams', () => {
    it('rejects when playerIn is in teamA or teamB of active match', async () => {
      prisma.teamPlayer.findFirst.mockImplementation(
        ({
          where,
        }: {
          where: { playerId: number; teamId?: { in?: number[] } };
        }) => {
          if (
            where.teamId?.in?.includes(teamAId) &&
            where.playerId === playerInActiveTeamId
          ) {
            return Promise.resolve({
              id: 1,
              teamId: teamAId,
              playerId: playerInActiveTeamId,
            });
          }
          return Promise.resolve(null);
        },
      );
      prisma.attendance.findFirst.mockResolvedValue({
        id: 702,
        sessionId,
        playerId: playerInActiveTeamId,
        status: 'ATIVO',
      });

      await expect(
        service.create(
          sessionId,
          {
            type: 'TEMPORARIA',
            reason: 'CANSACO',
            teamId: teamAId,
            playerOutId,
            playerInId: playerInActiveTeamId,
            matchId,
            minute: 5,
          },
          groupId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('rejection: playerIn AUSENTE or LESIONADO', () => {
    it('rejects AUSENTE', async () => {
      prisma.attendance.findFirst.mockResolvedValue({
        id: 703,
        sessionId,
        playerId: playerInReserveId,
        status: 'AUSENTE',
      });

      await expect(
        service.create(
          sessionId,
          {
            type: 'TEMPORARIA',
            reason: 'CANSACO',
            teamId: teamAId,
            playerOutId,
            playerInId: playerInReserveId,
            matchId,
            minute: 5,
          },
          groupId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects LESIONADO', async () => {
      prisma.attendance.findFirst.mockResolvedValue({
        id: 704,
        sessionId,
        playerId: playerInReserveId,
        status: 'LESIONADO',
      });

      await expect(
        service.create(
          sessionId,
          {
            type: 'TEMPORARIA',
            reason: 'CANSACO',
            teamId: teamAId,
            playerOutId,
            playerInId: playerInReserveId,
            matchId,
            minute: 5,
          },
          groupId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('rejection: session not IN_PROGRESS', () => {
    it('rejects PENDING', async () => {
      prisma.session.findFirst.mockResolvedValue({
        id: sessionId,
        groupId,
        status: 'PENDING',
      });

      await expect(
        service.create(
          sessionId,
          {
            type: 'TEMPORARIA',
            reason: 'CANSACO',
            teamId: teamAId,
            playerOutId,
            playerInId: playerInReserveId,
            matchId,
            minute: 5,
          },
          groupId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects FINISHED', async () => {
      prisma.session.findFirst.mockResolvedValue({
        id: sessionId,
        groupId,
        status: 'FINISHED',
      });

      await expect(
        service.create(
          sessionId,
          {
            type: 'PERMANENTE',
            reason: 'LESAO',
            teamId: teamAId,
            playerOutId,
            playerInId: playerInReserveId,
            matchId: null,
          },
          groupId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

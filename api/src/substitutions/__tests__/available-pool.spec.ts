import { Test, type TestingModule } from '@nestjs/testing';
import { SubstitutionsService } from '../substitutions.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('SubstitutionsService.getAvailablePool', () => {
  let service: SubstitutionsService;
  let prisma: {
    session: { findFirst: jest.Mock };
    match: { findFirst: jest.Mock };
    team: { findMany: jest.Mock };
    teamPlayer: { findMany: jest.Mock };
    attendance: { findMany: jest.Mock };
    player: { findMany: jest.Mock };
    matchPlayer: { findMany: jest.Mock };
  };

  const groupId = 1;
  const sessionId = 55;
  const teamAId = 100;
  const teamBId = 200;
  const teamCId = 300;

  const playerActiveA = { id: 1, name: 'PA1' };
  const playerActiveB = { id: 2, name: 'PB1' };
  const playerActiveC = { id: 3, name: 'PC1' };
  const playerReserve = { id: 99, name: 'Reserva' };
  const playerLesionado = { id: 50, name: 'Lesionado' };
  const playerAusente = { id: 60, name: 'Ausente' };

  beforeEach(async () => {
    prisma = {
      session: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: sessionId, groupId, status: 'IN_PROGRESS' }),
      },
      match: { findFirst: jest.fn() },
      team: { findMany: jest.fn() },
      teamPlayer: { findMany: jest.fn() },
      attendance: { findMany: jest.fn() },
      player: { findMany: jest.fn() },
      matchPlayer: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubstitutionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubstitutionsService>(SubstitutionsService);
  });

  describe('2 teams, no reserves', () => {
    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue({ id: 1, teamAId, teamBId });
      prisma.team.findMany.mockResolvedValue([
        {
          id: teamAId,
          name: 'A',
          color: '#ff0000',
          players: [{ player: playerActiveA }],
        },
        {
          id: teamBId,
          name: 'B',
          color: '#00ff00',
          players: [{ player: playerActiveB }],
        },
      ]);
      prisma.attendance.findMany.mockResolvedValue([]);
    });

    it('returns empty pool', async () => {
      const result = await service.getAvailablePool(sessionId, groupId);
      expect(result).toEqual({ reserves: [], waitingTeams: [] });
    });
  });

  describe('2 teams with RESERVA players', () => {
    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue({ id: 1, teamAId, teamBId });
      prisma.team.findMany.mockResolvedValue([
        {
          id: teamAId,
          name: 'A',
          color: '#ff0000',
          players: [{ player: playerActiveA }],
        },
        {
          id: teamBId,
          name: 'B',
          color: '#00ff00',
          players: [{ player: playerActiveB }],
        },
      ]);
      prisma.attendance.findMany.mockResolvedValue([
        {
          sessionId,
          playerId: playerReserve.id,
          status: 'RESERVA',
          player: playerReserve,
        },
      ]);
    });

    it('returns only reserves (no waiting teams)', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        reserves: Array<{ id: number }>;
        waitingTeams: Array<{
          team: { id: number };
          players: Array<{ id: number }>;
        }>;
      };
      expect(result.reserves.map((p) => p.id)).toEqual([playerReserve.id]);
      expect(result.waitingTeams).toEqual([]);
    });
  });

  describe('3+ teams with players from non-active team', () => {
    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue({ id: 1, teamAId, teamBId });
      prisma.team.findMany.mockResolvedValue([
        {
          id: teamAId,
          name: 'A',
          color: '#f00',
          players: [{ player: playerActiveA }],
        },
        {
          id: teamBId,
          name: 'B',
          color: '#0f0',
          players: [{ player: playerActiveB }],
        },
        {
          id: teamCId,
          name: 'C',
          color: '#00f',
          players: [{ player: playerActiveC }],
        },
      ]);
      prisma.attendance.findMany.mockResolvedValue([
        {
          sessionId,
          playerId: playerActiveA.id,
          status: 'ATIVO',
          player: playerActiveA,
        },
        {
          sessionId,
          playerId: playerActiveB.id,
          status: 'ATIVO',
          player: playerActiveB,
        },
        {
          sessionId,
          playerId: playerActiveC.id,
          status: 'ATIVO',
          player: playerActiveC,
        },
        {
          sessionId,
          playerId: playerReserve.id,
          status: 'RESERVA',
          player: playerReserve,
        },
      ]);
    });

    it('returns reserves AND waitingTeams with team C players', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        reserves: Array<{ id: number }>;
        waitingTeams: Array<{
          team: { id: number; name: string };
          players: Array<{ id: number }>;
        }>;
      };
      expect(result.reserves.map((p) => p.id)).toEqual([playerReserve.id]);
      expect(result.waitingTeams).toHaveLength(1);
      expect(result.waitingTeams[0]!.team.id).toBe(teamCId);
      expect(result.waitingTeams[0]!.players.map((p) => p.id)).toEqual([
        playerActiveC.id,
      ]);
    });
  });

  describe('attendance filters', () => {
    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue({ id: 1, teamAId, teamBId });
      prisma.team.findMany.mockResolvedValue([
        {
          id: teamAId,
          name: 'A',
          color: '#f00',
          players: [{ player: playerActiveA }],
        },
        {
          id: teamBId,
          name: 'B',
          color: '#0f0',
          players: [{ player: playerActiveB }],
        },
      ]);
      prisma.attendance.findMany.mockImplementation(
        ({
          where,
        }: {
          where: { status?: { in: string[] } | string };
        }) => {
          const all = [
            {
              sessionId,
              playerId: playerReserve.id,
              status: 'RESERVA',
              player: playerReserve,
            },
            {
              sessionId,
              playerId: playerLesionado.id,
              status: 'LESIONADO',
              player: playerLesionado,
            },
            {
              sessionId,
              playerId: playerAusente.id,
              status: 'AUSENTE',
              player: playerAusente,
            },
          ];
          const status = where.status;
          if (status && typeof status === 'object' && 'in' in status) {
            return Promise.resolve(
              all.filter((a) => status.in.includes(a.status)),
            );
          }
          if (typeof status === 'string') {
            return Promise.resolve(all.filter((a) => a.status === status));
          }
          return Promise.resolve(all);
        },
      );
    });

    it('excludes LESIONADO and AUSENTE from reserves', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        reserves: Array<{ id: number }>;
      };
      const ids = result.reserves.map((p) => p.id);
      expect(ids).toContain(playerReserve.id);
      expect(ids).not.toContain(playerLesionado.id);
      expect(ids).not.toContain(playerAusente.id);
    });
  });

  describe('ATIVO without team (orphan) must NOT appear in pool', () => {
    const playerOrphan = { id: 77, name: 'Orfao' };

    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue({ id: 1, teamAId, teamBId });
      prisma.team.findMany.mockResolvedValue([
        {
          id: teamAId,
          name: 'A',
          color: '#f00',
          players: [{ player: playerActiveA }],
        },
        {
          id: teamBId,
          name: 'B',
          color: '#0f0',
          players: [{ player: playerActiveB }],
        },
      ]);
      prisma.attendance.findMany.mockImplementation(
        ({ where }: { where: { status?: { in: string[] } | string } }) => {
          const all = [
            {
              sessionId,
              playerId: playerOrphan.id,
              status: 'ATIVO',
              player: playerOrphan,
            },
            {
              sessionId,
              playerId: playerReserve.id,
              status: 'RESERVA',
              player: playerReserve,
            },
          ];
          const status = where.status;
          if (status && typeof status === 'object' && 'in' in status) {
            return Promise.resolve(
              all.filter((a) => status.in.includes(a.status)),
            );
          }
          if (typeof status === 'string') {
            return Promise.resolve(all.filter((a) => a.status === status));
          }
          return Promise.resolve(all);
        },
      );
    });

    it('returns only RESERVA-status players; ATIVO orphan filtered out', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        reserves: Array<{ id: number; name: string }>;
      };
      const ids = result.reserves.map((p) => p.id);
      expect(ids).toContain(playerReserve.id);
      expect(ids).not.toContain(playerOrphan.id);
    });
  });

  describe('same-match benched players', () => {
    const playerBenched = { id: 88, name: 'Benched' };
    const playerBenchedInjured = { id: 89, name: 'Injured' };

    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue({
        id: 555,
        teamAId,
        teamBId,
      });
      prisma.team.findMany.mockResolvedValue([
        {
          id: teamAId,
          name: 'A',
          color: '#f00',
          players: [
            { player: playerActiveA },
            { player: playerBenched },
            { player: playerBenchedInjured },
          ],
        },
        {
          id: teamBId,
          name: 'B',
          color: '#0f0',
          players: [{ player: playerActiveB }],
        },
      ]);
      prisma.matchPlayer.findMany.mockResolvedValue([
        {
          matchId: 555,
          playerId: playerActiveA.id,
          teamId: teamAId,
          leftMinute: null,
          player: playerActiveA,
        },
        {
          matchId: 555,
          playerId: playerBenched.id,
          teamId: teamAId,
          leftMinute: 5,
          player: playerBenched,
        },
        {
          matchId: 555,
          playerId: playerBenchedInjured.id,
          teamId: teamAId,
          leftMinute: 8,
          player: playerBenchedInjured,
        },
        {
          matchId: 555,
          playerId: playerActiveB.id,
          teamId: teamBId,
          leftMinute: null,
          player: playerActiveB,
        },
      ]);
      prisma.attendance.findMany.mockImplementation(
        ({ where }: { where: { status?: { in: string[] } | string } }) => {
          const all = [
            {
              sessionId,
              playerId: playerActiveA.id,
              status: 'ATIVO',
              player: playerActiveA,
            },
            {
              sessionId,
              playerId: playerActiveB.id,
              status: 'ATIVO',
              player: playerActiveB,
            },
            {
              sessionId,
              playerId: playerBenched.id,
              status: 'RESERVA',
              player: playerBenched,
            },
            {
              sessionId,
              playerId: playerBenchedInjured.id,
              status: 'LESIONADO',
              player: playerBenchedInjured,
            },
          ];
          const status = where.status;
          if (status && typeof status === 'object' && 'in' in status) {
            return Promise.resolve(
              all.filter((a) => status.in.includes(a.status)),
            );
          }
          if (typeof status === 'string') {
            return Promise.resolve(all.filter((a) => a.status === status));
          }
          return Promise.resolve(all);
        },
      );
    });

    it('includes benched player with valid attendance in reserves', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        reserves: Array<{ id: number; name: string }>;
      };
      const ids = result.reserves.map((p) => p.id);
      expect(ids).toContain(playerBenched.id);
    });

    it('excludes benched player with LESIONADO attendance', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        reserves: Array<{ id: number; name: string }>;
      };
      const ids = result.reserves.map((p) => p.id);
      expect(ids).not.toContain(playerBenchedInjured.id);
    });

    it('excludes players currently on the field', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        reserves: Array<{ id: number; name: string }>;
      };
      const ids = result.reserves.map((p) => p.id);
      expect(ids).not.toContain(playerActiveA.id);
      expect(ids).not.toContain(playerActiveB.id);
    });
  });

  describe('waitingTeams attendance filter', () => {
    const playerInjuredOnTeamC = { id: 91, name: 'InjuredC' };

    beforeEach(() => {
      prisma.match.findFirst.mockResolvedValue({ id: 1, teamAId, teamBId });
      prisma.team.findMany.mockResolvedValue([
        {
          id: teamAId,
          name: 'A',
          color: '#f00',
          players: [{ player: playerActiveA }],
        },
        {
          id: teamBId,
          name: 'B',
          color: '#0f0',
          players: [{ player: playerActiveB }],
        },
        {
          id: teamCId,
          name: 'C',
          color: '#00f',
          players: [
            { player: playerActiveC },
            { player: playerInjuredOnTeamC },
          ],
        },
      ]);
      prisma.attendance.findMany.mockImplementation(
        ({ where }: { where: { status?: { in: string[] } | string } }) => {
          const all = [
            {
              sessionId,
              playerId: playerActiveA.id,
              status: 'ATIVO',
              player: playerActiveA,
            },
            {
              sessionId,
              playerId: playerActiveB.id,
              status: 'ATIVO',
              player: playerActiveB,
            },
            {
              sessionId,
              playerId: playerActiveC.id,
              status: 'ATIVO',
              player: playerActiveC,
            },
            {
              sessionId,
              playerId: playerInjuredOnTeamC.id,
              status: 'LESIONADO',
              player: playerInjuredOnTeamC,
            },
          ];
          const status = where.status;
          if (status && typeof status === 'object' && 'in' in status) {
            return Promise.resolve(
              all.filter((a) => status.in.includes(a.status)),
            );
          }
          if (typeof status === 'string') {
            return Promise.resolve(all.filter((a) => a.status === status));
          }
          return Promise.resolve(all);
        },
      );
    });

    it('excludes LESIONADO player from waitingTeams roster', async () => {
      const result = (await service.getAvailablePool(sessionId, groupId)) as {
        waitingTeams: Array<{
          team: { id: number };
          players: Array<{ id: number }>;
        }>;
      };
      expect(result.waitingTeams).toHaveLength(1);
      const teamCIds = result.waitingTeams[0]!.players.map((p) => p.id);
      expect(teamCIds).toContain(playerActiveC.id);
      expect(teamCIds).not.toContain(playerInjuredOnTeamC.id);
    });
  });
});

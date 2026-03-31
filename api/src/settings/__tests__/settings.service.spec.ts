import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '../settings.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockTx = {
    goal: { deleteMany: jest.fn() },
    matchEvent: { deleteMany: jest.fn() },
    match: { deleteMany: jest.fn() },
    champion: { deleteMany: jest.fn() },
    teamPlayer: { deleteMany: jest.fn() },
    team: { deleteMany: jest.fn() },
    attendance: { deleteMany: jest.fn() },
    session: { deleteMany: jest.fn() },
    season: { deleteMany: jest.fn() },
    player: { deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<void>) => cb(mockTx)),
            settings: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            vest: { deleteMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('resetData', () => {
    it('should call $transaction', async () => {
      await service.resetData();
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should delete from all 10 tables in correct FK order', async () => {
      await service.resetData();

      const callOrder: string[] = [];
      for (const [table, mock] of Object.entries(mockTx)) {
        if (mock.deleteMany.mock.calls.length > 0) {
          callOrder.push(table);
        }
      }

      expect(callOrder).toEqual([
        'goal',
        'matchEvent',
        'match',
        'champion',
        'teamPlayer',
        'team',
        'attendance',
        'session',
        'season',
        'player',
      ]);
    });

    it('should call deleteMany for each of the 10 tables', async () => {
      await service.resetData();

      expect(mockTx.goal.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.matchEvent.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.match.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.champion.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.teamPlayer.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.team.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.attendance.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.session.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.season.deleteMany).toHaveBeenCalledTimes(1);
      expect(mockTx.player.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('should NOT delete User, Settings, or Vest tables', async () => {
      await service.resetData();

      // mockTx does not contain user, settings, or vest — confirming they are never called
      const deletedTables = Object.keys(mockTx);
      expect(deletedTables).not.toContain('user');
      expect(deletedTables).not.toContain('settings');
      expect(deletedTables).not.toContain('vest');
    });

    it('should return success message', async () => {
      const result = await service.resetData();
      expect(result).toEqual({ message: 'Dados resetados com sucesso.' });
    });

    it('should propagate error if transaction fails', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
      await expect(service.resetData()).rejects.toThrow('DB error');
    });
  });
});

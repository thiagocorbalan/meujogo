import { Test, type TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AdminService', () => {
  let service: AdminService;
  let prismaService: any;

  beforeEach(async () => {
    prismaService = {
      user: {
        count: jest.fn(),
      },
      player: {
        count: jest.fn(),
      },
      session: {
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      integrationConfig: {
        findUnique: jest.fn(),
      },
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should return expected shape with mocked counts', async () => {
      prismaService.user.count.mockResolvedValue(42);
      prismaService.player.count
        .mockResolvedValueOnce(30) // LINHA players
        .mockResolvedValueOnce(5); // GOLEIRO players
      prismaService.session.count
        .mockResolvedValueOnce(3) // sessions today
        .mockResolvedValueOnce(15); // sessions this week
      prismaService.session.groupBy.mockResolvedValue([
        { groupId: 1 },
        { groupId: 2 },
        { groupId: 3 },
      ]);
      prismaService.$queryRaw
        .mockResolvedValueOnce([
          { date: '2026-04-01', count: '5' },
          { date: '2026-04-02', count: '3' },
        ])
        .mockResolvedValueOnce([
          {
            groupId: 1,
            groupName: 'Group A',
            ownerEmail: 'owner@example.com',
            sessionCount: '10',
          },
        ])
        .mockResolvedValueOnce([
          { dow: '1', count: '8' },
          { dow: '3', count: '12' },
        ]);

      const result = await service.getStats('week');

      expect(result).toMatchObject({
        totalUsers: 42,
        totalLinhaPlayers: 30,
        totalGoalkeepers: 5,
        sessionsToday: 3,
        sessionsThisWeek: 15,
        activeGroups: 3,
      });
      expect(result.newUsersChart).toEqual([
        { date: '2026-04-01', count: 5 },
        { date: '2026-04-02', count: 3 },
      ]);
      expect(result.topActiveGroups).toEqual([
        {
          groupId: 1,
          groupName: 'Group A',
          ownerEmail: 'owner@example.com',
          sessionCount: 10,
        },
      ]);
      expect(result.matchHeatmap).toHaveLength(7);
      expect(result.matchHeatmap[0]!.day).toBe('Sun');
      expect(result.matchHeatmap[1]!.count).toBe(8);
      expect(result.matchHeatmap[3]!.count).toBe(12);
    });

    it('should default to "week" period when no period is provided', async () => {
      prismaService.user.count.mockResolvedValue(0);
      prismaService.player.count.mockResolvedValue(0);
      prismaService.session.count.mockResolvedValue(0);
      prismaService.session.groupBy.mockResolvedValue([]);
      prismaService.$queryRaw.mockResolvedValue([]);

      const result = await service.getStats();

      expect(result).toHaveProperty('totalUsers');
      expect(result).toHaveProperty('activeGroups');
      expect(result).toHaveProperty('matchHeatmap');
    });

    it('should handle "day" and "month" periods without errors', async () => {
      prismaService.user.count.mockResolvedValue(10);
      prismaService.player.count.mockResolvedValue(0);
      prismaService.session.count.mockResolvedValue(0);
      prismaService.session.groupBy.mockResolvedValue([]);
      prismaService.$queryRaw.mockResolvedValue([]);

      const dayResult = await service.getStats('day');
      expect(dayResult.totalUsers).toBe(10);

      prismaService.user.count.mockResolvedValue(20);
      prismaService.player.count.mockResolvedValue(0);
      prismaService.session.count.mockResolvedValue(0);
      prismaService.session.groupBy.mockResolvedValue([]);
      prismaService.$queryRaw.mockResolvedValue([]);

      const monthResult = await service.getStats('month');
      expect(monthResult.totalUsers).toBe(20);
    });

    it('should fill matchHeatmap with zeros for days with no matches', async () => {
      prismaService.user.count.mockResolvedValue(0);
      prismaService.player.count.mockResolvedValue(0);
      prismaService.session.count.mockResolvedValue(0);
      prismaService.session.groupBy.mockResolvedValue([]);
      prismaService.$queryRaw
        .mockResolvedValueOnce([]) // newUsersChart
        .mockResolvedValueOnce([]) // topActiveGroups
        .mockResolvedValueOnce([]); // heatmap — no data

      const result = await service.getStats('week');

      expect(result.matchHeatmap).toHaveLength(7);
      result.matchHeatmap.forEach((entry: { day: string; count: number }) => {
        expect(entry.count).toBe(0);
      });
    });
  });

  describe('getStripeStats', () => {
    it('should return {stripeConfigured: false} when no STRIPE config exists', async () => {
      prismaService.integrationConfig.findUnique.mockResolvedValue(null);

      const result = await service.getStripeStats();

      expect(result).toEqual({ stripeConfigured: false });
      expect(prismaService.integrationConfig.findUnique).toHaveBeenCalledWith({
        where: { service: 'STRIPE' },
      });
    });

    it('should return {stripeConfigured: false} when config exists but isConfigured is false', async () => {
      prismaService.integrationConfig.findUnique.mockResolvedValue({
        service: 'STRIPE',
        isConfigured: false,
      });

      const result = await service.getStripeStats();

      expect(result).toEqual({ stripeConfigured: false });
    });

    it('should return stripeConfigured: true with null stats when config is configured', async () => {
      prismaService.integrationConfig.findUnique.mockResolvedValue({
        service: 'STRIPE',
        isConfigured: true,
      });

      const result = await service.getStripeStats();

      expect(result).toEqual({
        stripeConfigured: true,
        mrr: null,
        subscribers: null,
        churnRate: null,
        trials: null,
      });
    });
  });
});

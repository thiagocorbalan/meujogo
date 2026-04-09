import { Test, TestingModule } from '@nestjs/testing';
import { SeasonsService } from '../seasons.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

describe('SeasonsService', () => {
  let service: SeasonsService;
  let prisma: PrismaService;

  const groupId = 1;

  const mockTx = {
    season: {
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonsService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<any>) => cb(mockTx)),
            season: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<SeasonsService>(SeasonsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('closeAndCreateNew', () => {
    const newSeason = { id: 2, year: 2026, startDate: expect.any(Date), isClosed: false };

    it('should use a transaction', async () => {
      mockTx.season.findFirst.mockResolvedValue(null);
      mockTx.season.create.mockResolvedValue(newSeason);

      await service.closeAndCreateNew(groupId);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should close existing open season and create new one', async () => {
      const openSeason = { id: 1, year: 2025, isClosed: false };
      mockTx.season.findFirst.mockResolvedValue(openSeason);
      mockTx.season.update.mockResolvedValue({ ...openSeason, isClosed: true });
      mockTx.season.create.mockResolvedValue(newSeason);

      const result = await service.closeAndCreateNew(groupId);

      expect(mockTx.season.findFirst).toHaveBeenCalledWith({ where: { isClosed: false, groupId } });
      expect(mockTx.season.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          isClosed: true,
          endDate: expect.any(Date),
        },
      });
      expect(mockTx.season.create).toHaveBeenCalledWith({
        data: {
          year: expect.any(Number),
          startDate: expect.any(Date),
          isClosed: false,
          groupId,
        },
      });
      expect(result).toEqual(newSeason);
    });

    it('should only create new season if no open season exists', async () => {
      mockTx.season.findFirst.mockResolvedValue(null);
      mockTx.season.create.mockResolvedValue(newSeason);

      const result = await service.closeAndCreateNew(groupId);

      expect(mockTx.season.findFirst).toHaveBeenCalledWith({ where: { isClosed: false, groupId } });
      expect(mockTx.season.update).not.toHaveBeenCalled();
      expect(mockTx.season.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(newSeason);
    });

    it('should propagate error if transaction fails', async () => {
      (prisma.$transaction as jest.Mock).mockRejectedValueOnce(new Error('DB error'));
      await expect(service.closeAndCreateNew(groupId)).rejects.toThrow('DB error');
    });
  });
});

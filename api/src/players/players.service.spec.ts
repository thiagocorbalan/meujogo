import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PlayersService', () => {
  let service: PlayersService;
  let prisma: PrismaService;

  const mockPrisma = {
    player: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    settings: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<PlayersService>(PlayersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // updateMe(userId, groupId, dto)
  // ---------------------------------------------------------------------------
  describe('updateMe', () => {
    const userId = 1;
    const groupId = 10;

    const existingPlayer = {
      id: 100,
      name: 'Jogador Original',
      position: 'LINHA',
      type: 'FIXO',
      status: 'ATIVO',
      elo: 1450,
      isActive: true,
      goals: 12,
      games: 20,
      groupId,
      userId,
    };

    it('should find Player by userId+groupId, update name/position/status', async () => {
      const dto = { name: 'Novo Nome', position: 'GOLEIRO' as const, status: 'LESIONADO' as const };
      const updatedPlayer = { ...existingPlayer, ...dto };

      mockPrisma.player.findFirst.mockResolvedValue(existingPlayer);
      mockPrisma.player.update.mockResolvedValue(updatedPlayer);

      const result = await service.updateMe(userId, groupId, dto);

      expect(mockPrisma.player.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId, groupId }),
        }),
      );
      expect(mockPrisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: existingPlayer.id }),
          data: expect.objectContaining({
            name: dto.name,
            position: dto.position,
            status: dto.status,
          }),
        }),
      );
      expect(result.name).toBe('Novo Nome');
    });

    it('should throw NotFoundException if no Player found for userId+groupId', async () => {
      mockPrisma.player.findFirst.mockResolvedValue(null);

      await expect(
        service.updateMe(userId, groupId, { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should only update allowed fields (name, position, status) — not elo, goals, games, type', async () => {
      const dto = { name: 'Novo Nome', position: 'GOLEIRO' as const, status: 'LESIONADO' as const };
      const updatedPlayer = { ...existingPlayer, ...dto };

      mockPrisma.player.findFirst.mockResolvedValue(existingPlayer);
      mockPrisma.player.update.mockResolvedValue(updatedPlayer);

      await service.updateMe(userId, groupId, dto);

      const updateCallData = mockPrisma.player.update.mock.calls[0][0].data;
      expect(updateCallData).not.toHaveProperty('elo');
      expect(updateCallData).not.toHaveProperty('goals');
      expect(updateCallData).not.toHaveProperty('games');
      expect(updateCallData).not.toHaveProperty('type');
    });
  });
});

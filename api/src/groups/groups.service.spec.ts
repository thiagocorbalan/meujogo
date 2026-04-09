import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupsService } from './groups.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('GroupsService', () => {
  let service: GroupsService;
  let prisma: PrismaService;

  const mockTx = {
    group: { create: jest.fn() },
    settings: { create: jest.fn() },
    groupMember: { create: jest.fn() },
    player: { create: jest.fn() },
  };

  const mockPrisma = {
    $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<any>) => cb(mockTx)),
    group: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    groupMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    player: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    settings: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    session: {
      findFirst: jest.fn(),
    },
    attendance: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // createGroup(userId, dto)
  // ---------------------------------------------------------------------------
  describe('createGroup', () => {
    const userId = 1;
    const dto = {
      name: 'Pelada do Parque',
      description: 'Futebol toda quarta',
      dayOfWeek: 3,
      defaultTime: '19:00',
      address: 'Parque Ibirapuera',
    };

    const createdGroup = {
      id: 10,
      name: dto.name,
      slug: 'pelada-do-parque',
      description: dto.description,
      dayOfWeek: dto.dayOfWeek,
      defaultTime: dto.defaultTime,
      address: dto.address,
      inviteCode: 'ABC12345',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const createdSettings = {
      id: 1,
      groupId: createdGroup.id,
      maxTeams: 4,
      playersPerTeam: 5,
      sessionDurationMin: 60,
      matchDurationMin: 10,
      drawMode: 'ALEATORIO',
      defaultElo: 1200,
      kFactor: 32,
      maxConsecutiveGames: 2,
    };

    const createdPlayer = {
      id: 100,
      name: 'User Player',
      position: 'LINHA',
      type: 'FIXO',
      status: 'ATIVO',
      elo: 1200,
      isActive: true,
      groupId: createdGroup.id,
      userId,
    };

    const createdMember = {
      id: 50,
      groupId: createdGroup.id,
      userId,
      playerId: createdPlayer.id,
      role: 'DONO',
      isActive: true,
    };

    beforeEach(() => {
      mockTx.group.create.mockResolvedValue(createdGroup);
      mockTx.settings.create.mockResolvedValue(createdSettings);
      mockTx.player.create.mockResolvedValue(createdPlayer);
      mockTx.groupMember.create.mockResolvedValue(createdMember);
    });

    it('should create Group, Settings, GroupMember (DONO) and Player in a transaction', async () => {
      const result = await service.createGroup(userId, dto);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockTx.group.create).toHaveBeenCalledTimes(1);
      expect(mockTx.settings.create).toHaveBeenCalledTimes(1);
      expect(mockTx.groupMember.create).toHaveBeenCalledTimes(1);
      expect(mockTx.player.create).toHaveBeenCalledTimes(1);

      // GroupMember should be created with DONO role
      expect(mockTx.groupMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: 'DONO',
            userId,
          }),
        }),
      );

      expect(result).toBeDefined();
    });

    it('should generate slug from name (lowercase, spaces to hyphens)', async () => {
      await service.createGroup(userId, dto);

      expect(mockTx.group.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'pelada-do-parque',
          }),
        }),
      );
    });

    it('should generate an 8-character invite code', async () => {
      await service.createGroup(userId, dto);

      const callArgs = mockTx.group.create.mock.calls[0][0];
      const inviteCode = callArgs.data.inviteCode;

      expect(typeof inviteCode).toBe('string');
      expect(inviteCode).toHaveLength(8);
    });

    it('should create Settings with default values linked to the group', async () => {
      await service.createGroup(userId, dto);

      expect(mockTx.settings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            groupId: createdGroup.id,
          }),
        }),
      );
    });

    it('should create Player linked to user and group', async () => {
      await service.createGroup(userId, dto);

      expect(mockTx.player.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            groupId: createdGroup.id,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // findAllByUser(userId)
  // ---------------------------------------------------------------------------
  describe('findAllByUser', () => {
    const userId = 1;

    it('should return only groups where user is an active member', async () => {
      const groups = [
        { id: 1, name: 'Group A', slug: 'group-a', isActive: true },
        { id: 2, name: 'Group B', slug: 'group-b', isActive: true },
      ];
      mockPrisma.groupMember.findMany.mockResolvedValue(
        groups.map((g) => ({ group: g, isActive: true, userId })),
      );

      const result = await service.findAllByUser(userId);

      expect(mockPrisma.groupMember.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            isActive: true,
          }),
        }),
      );
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // findOne(groupId)
  // ---------------------------------------------------------------------------
  describe('findOne', () => {
    const groupId = 10;

    it('should return group with member count', async () => {
      const group = {
        id: groupId,
        name: 'Pelada do Parque',
        slug: 'pelada-do-parque',
        isActive: true,
        _count: { members: 8 },
      };
      mockPrisma.group.findFirst.mockResolvedValue(group);

      const result = await service.findOne(groupId);

      expect(result).toBeDefined();
      expect(mockPrisma.group.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: groupId }),
        }),
      );
    });

    it('should throw NotFoundException if group not found', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if group is inactive', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(null);

      await expect(service.findOne(groupId)).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // update(groupId, dto)
  // ---------------------------------------------------------------------------
  describe('update', () => {
    const groupId = 10;
    const dto = {
      name: 'Pelada Atualizada',
      description: 'Nova descricao',
      dayOfWeek: 5,
      defaultTime: '20:00',
      address: 'Novo endereco',
    };

    it('should update group fields (name, description, dayOfWeek, defaultTime, address)', async () => {
      const updatedGroup = { id: groupId, ...dto, slug: 'pelada-atualizada', isActive: true };
      mockPrisma.group.update.mockResolvedValue(updatedGroup);

      const result = await service.update(groupId, dto);

      expect(mockPrisma.group.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: groupId }),
          data: expect.objectContaining({
            name: dto.name,
            description: dto.description,
            dayOfWeek: dto.dayOfWeek,
            defaultTime: dto.defaultTime,
            address: dto.address,
          }),
        }),
      );
      expect(result).toEqual(updatedGroup);
    });
  });

  // ---------------------------------------------------------------------------
  // softDelete(groupId)
  // ---------------------------------------------------------------------------
  describe('softDelete', () => {
    const groupId = 10;

    it('should set isActive=false on the group', async () => {
      const deletedGroup = { id: groupId, isActive: false };
      mockPrisma.group.update.mockResolvedValue(deletedGroup);

      await service.softDelete(groupId);

      expect(mockPrisma.group.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: groupId }),
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getInviteInfo(inviteCode)
  // ---------------------------------------------------------------------------
  describe('getInviteInfo', () => {
    const inviteCode = 'ABC12345';

    it('should return group name, description, member count, dayOfWeek, defaultTime, address', async () => {
      const group = {
        id: 10,
        name: 'Pelada do Parque',
        description: 'Futebol toda quarta',
        dayOfWeek: 3,
        defaultTime: '19:00',
        address: 'Parque Ibirapuera',
        inviteCode,
        isActive: true,
        _count: { members: 5 },
      };
      mockPrisma.group.findFirst.mockResolvedValue(group);

      const result = await service.getInviteInfo(inviteCode);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('name', 'Pelada do Parque');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('dayOfWeek');
      expect(result).toHaveProperty('defaultTime');
      expect(result).toHaveProperty('address');
      expect(mockPrisma.group.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ inviteCode }),
        }),
      );
    });

    it('should throw NotFoundException for invalid invite code', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(null);

      await expect(service.getInviteInfo('INVALID1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for inactive group', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(null);

      await expect(service.getInviteInfo(inviteCode)).rejects.toThrow(NotFoundException);
    });
  });

  // ---------------------------------------------------------------------------
  // joinViaInvite(inviteCode, userId)
  // ---------------------------------------------------------------------------
  describe('joinViaInvite', () => {
    const inviteCode = 'ABC12345';
    const userId = 2;
    const group = {
      id: 10,
      name: 'Pelada do Parque',
      inviteCode,
      isActive: true,
      settings: {
        maxTeams: 4,
        playersPerTeam: 5,
      },
      _count: { members: 5 },
    };

    it('should create GroupMember + Player and return membership', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(group);
      mockPrisma.groupMember.findFirst.mockResolvedValue(null); // not already member
      mockPrisma.player.create.mockResolvedValue({ id: 200, userId, groupId: group.id });
      mockPrisma.groupMember.create.mockResolvedValue({
        id: 60,
        groupId: group.id,
        userId,
        role: 'JOGADOR',
        isActive: true,
      });

      const result = await service.joinViaInvite(inviteCode, userId);

      expect(result).toBeDefined();
      expect(mockPrisma.groupMember.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if user is already a member', async () => {
      mockPrisma.group.findFirst.mockResolvedValue(group);
      mockPrisma.groupMember.findFirst.mockResolvedValue({
        id: 60,
        groupId: group.id,
        userId,
        isActive: true,
      });

      await expect(service.joinViaInvite(inviteCode, userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ForbiddenException if group is full (member limit from settings)', async () => {
      const fullGroup = {
        ...group,
        _count: { members: 20 }, // maxTeams(4) * playersPerTeam(5) = 20
      };
      mockPrisma.group.findFirst.mockResolvedValue(fullGroup);
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(service.joinViaInvite(inviteCode, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // regenerateInviteCode(groupId)
  // ---------------------------------------------------------------------------
  describe('regenerateInviteCode', () => {
    const groupId = 10;

    it('should generate a new invite code and return it', async () => {
      const updatedGroup = { id: groupId, inviteCode: 'NEW12345' };
      mockPrisma.group.update.mockResolvedValue(updatedGroup);

      const result = await service.regenerateInviteCode(groupId);

      expect(mockPrisma.group.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: groupId }),
          data: expect.objectContaining({
            inviteCode: expect.any(String),
          }),
        }),
      );

      expect(result).toBeDefined();
      expect(typeof result.inviteCode).toBe('string');
      expect(result.inviteCode).toHaveLength(8);
    });
  });

  // ---------------------------------------------------------------------------
  // addGuestPlayer(groupId, dto)
  // ---------------------------------------------------------------------------
  describe('addGuestPlayer', () => {
    const groupId = 10;
    const dto = {
      name: 'Convidado Joao',
      position: 'LINHA' as const,
    };

    it('should create Player with type=CONVIDADO, no userId, linked to group', async () => {
      const guestPlayer = {
        id: 300,
        name: dto.name,
        position: dto.position,
        type: 'CONVIDADO',
        status: 'ATIVO',
        elo: 1200,
        isActive: true,
        groupId,
        userId: null,
      };
      mockPrisma.player.create.mockResolvedValue(guestPlayer);
      mockPrisma.session.findFirst.mockResolvedValue(null);

      const result = await service.addGuestPlayer(groupId, dto);

      expect(mockPrisma.player.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: dto.name,
            position: dto.position,
            type: 'CONVIDADO',
            groupId,
          }),
        }),
      );

      // userId should NOT be set
      const createCallData = mockPrisma.player.create.mock.calls[0][0].data;
      expect(createCallData.userId).toBeUndefined();

      expect(result).toBeDefined();
    });

    it('should create Attendance for current session if one exists', async () => {
      const guestPlayer = {
        id: 300,
        name: dto.name,
        position: dto.position,
        type: 'CONVIDADO',
        groupId,
        userId: null,
      };
      const currentSession = { id: 50, groupId, status: 'PENDING' };

      mockPrisma.player.create.mockResolvedValue(guestPlayer);
      mockPrisma.session.findFirst.mockResolvedValue(currentSession);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 1,
        sessionId: currentSession.id,
        playerId: guestPlayer.id,
        status: 'ATIVO',
      });

      await service.addGuestPlayer(groupId, dto);

      expect(mockPrisma.attendance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            sessionId: currentSession.id,
            playerId: guestPlayer.id,
          }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // linkUserToPlayer(playerId, userId)
  // ---------------------------------------------------------------------------
  describe('linkUserToPlayer', () => {
    const playerId = 300;
    const userId = 5;

    it('should set userId on Player and return updated player', async () => {
      const existingPlayer = {
        id: playerId,
        name: 'Guest',
        userId: null,
        groupId: 10,
      };
      const updatedPlayer = { ...existingPlayer, userId };

      mockPrisma.player.findFirst.mockResolvedValue(existingPlayer);
      mockPrisma.player.update.mockResolvedValue(updatedPlayer);

      const result = await service.linkUserToPlayer(playerId, userId);

      expect(mockPrisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: playerId }),
          data: expect.objectContaining({ userId }),
        }),
      );
      expect(result).toEqual(updatedPlayer);
    });

    it('should throw NotFoundException if player not found', async () => {
      mockPrisma.player.findFirst.mockResolvedValue(null);

      await expect(service.linkUserToPlayer(999, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // addMember(groupId, userId, role)
  // ---------------------------------------------------------------------------
  describe('addMember', () => {
    const groupId = 10;
    const userId = 3;
    const role = 'JOGADOR';

    it('should create GroupMember + Player', async () => {
      const createdPlayer = { id: 400, userId, groupId };
      const createdMember = {
        id: 70,
        groupId,
        userId,
        playerId: createdPlayer.id,
        role,
        isActive: true,
      };

      mockPrisma.player.create.mockResolvedValue(createdPlayer);
      mockPrisma.groupMember.create.mockResolvedValue(createdMember);

      const result = await service.addMember(groupId, userId, role);

      expect(mockPrisma.groupMember.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            groupId,
            userId,
            role,
          }),
        }),
      );
      expect(result).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // removeMember(groupId, memberId)
  // ---------------------------------------------------------------------------
  describe('removeMember', () => {
    const groupId = 10;
    const memberId = 70;

    it('should set isActive=false on GroupMember', async () => {
      const deactivatedMember = { id: memberId, groupId, isActive: false };
      mockPrisma.groupMember.update.mockResolvedValue(deactivatedMember);

      await service.removeMember(groupId, memberId);

      expect(mockPrisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: memberId }),
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateMemberRole(groupId, memberId, role)
  // ---------------------------------------------------------------------------
  describe('updateMemberRole', () => {
    const groupId = 10;
    const memberId = 70;
    const newRole = 'ADMIN';

    it('should update role on GroupMember', async () => {
      const updatedMember = { id: memberId, groupId, role: newRole };
      mockPrisma.groupMember.update.mockResolvedValue(updatedMember);

      const result = await service.updateMemberRole(groupId, memberId, newRole);

      expect(mockPrisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: memberId }),
          data: expect.objectContaining({ role: newRole }),
        }),
      );
      expect(result).toEqual(updatedMember);
    });
  });

  // ---------------------------------------------------------------------------
  // leaveGroup(groupId, userId)
  // ---------------------------------------------------------------------------
  describe('leaveGroup', () => {
    const groupId = 10;
    const userId = 2;

    it('should set isActive=false on own membership', async () => {
      const membership = {
        id: 60,
        groupId,
        userId,
        role: 'JOGADOR',
        isActive: true,
      };
      mockPrisma.groupMember.findFirst.mockResolvedValue(membership);
      mockPrisma.groupMember.update.mockResolvedValue({ ...membership, isActive: false });

      // Ensure there are other DONOs (or user is not DONO)
      mockPrisma.groupMember.findMany.mockResolvedValue([]);

      await service.leaveGroup(groupId, userId);

      expect(mockPrisma.groupMember.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: membership.id }),
          data: expect.objectContaining({ isActive: false }),
        }),
      );
    });

    it('should throw BadRequestException if user is sole DONO', async () => {
      const ownerMembership = {
        id: 60,
        groupId,
        userId,
        role: 'DONO',
        isActive: true,
      };
      mockPrisma.groupMember.findFirst.mockResolvedValue(ownerMembership);
      // No other active DONOs in the group
      mockPrisma.groupMember.findMany.mockResolvedValue([ownerMembership]);

      await expect(service.leaveGroup(groupId, userId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // suspendMember(groupId, memberId)
  // ---------------------------------------------------------------------------
  describe('suspendMember', () => {
    const groupId = 10;
    const memberId = 70;

    const activeMember = {
      id: memberId,
      groupId,
      userId: 3,
      playerId: 400,
      role: 'JOGADOR',
      isActive: true,
    };

    const activePlayer = {
      id: 400,
      name: 'Jogador Teste',
      position: 'LINHA',
      type: 'FIXO',
      status: 'ATIVO',
      elo: 1200,
      isActive: true,
      goals: 5,
      games: 10,
      groupId,
      userId: 3,
    };

    it('should find GroupMember by id+groupId, find linked Player, update Player.status to AUSENTE', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(activeMember);
      mockPrisma.player.findFirst.mockResolvedValue(activePlayer);
      mockPrisma.player.update.mockResolvedValue({ ...activePlayer, status: 'AUSENTE' });

      const result = await service.suspendMember(groupId, memberId);

      expect(mockPrisma.groupMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: memberId, groupId }),
        }),
      );
      expect(mockPrisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: activePlayer.id }),
          data: expect.objectContaining({ status: 'AUSENTE' }),
        }),
      );
      expect(result.status).toBe('AUSENTE');
    });

    it('should throw BadRequestException if Player.status is already AUSENTE', async () => {
      const suspendedPlayer = { ...activePlayer, status: 'AUSENTE' };
      mockPrisma.groupMember.findFirst.mockResolvedValue(activeMember);
      mockPrisma.player.findFirst.mockResolvedValue(suspendedPlayer);

      await expect(service.suspendMember(groupId, memberId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.suspendMember(groupId, memberId)).rejects.toThrow(
        'Membro já está suspenso',
      );
    });

    it('should throw ForbiddenException if member role is DONO', async () => {
      const ownerMember = { ...activeMember, role: 'DONO' };
      mockPrisma.groupMember.findFirst.mockResolvedValue(ownerMember);
      mockPrisma.player.findFirst.mockResolvedValue(activePlayer);

      await expect(service.suspendMember(groupId, memberId)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.suspendMember(groupId, memberId)).rejects.toThrow(
        'Não é possível suspender o dono do grupo',
      );
    });

    it('should throw NotFoundException if member not found', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(null);

      await expect(service.suspendMember(groupId, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // reactivateMember(groupId, memberId)
  // ---------------------------------------------------------------------------
  describe('reactivateMember', () => {
    const groupId = 10;
    const memberId = 70;

    const suspendedMember = {
      id: memberId,
      groupId,
      userId: 3,
      playerId: 400,
      role: 'JOGADOR',
      isActive: true,
    };

    const suspendedPlayer = {
      id: 400,
      name: 'Jogador Teste',
      position: 'LINHA',
      type: 'FIXO',
      status: 'AUSENTE',
      elo: 1200,
      isActive: true,
      goals: 5,
      games: 10,
      groupId,
      userId: 3,
    };

    it('should find GroupMember, update Player.status to ATIVO', async () => {
      mockPrisma.groupMember.findFirst.mockResolvedValue(suspendedMember);
      mockPrisma.player.findFirst.mockResolvedValue(suspendedPlayer);
      mockPrisma.player.update.mockResolvedValue({ ...suspendedPlayer, status: 'ATIVO' });

      const result = await service.reactivateMember(groupId, memberId);

      expect(mockPrisma.groupMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: memberId, groupId }),
        }),
      );
      expect(mockPrisma.player.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: suspendedPlayer.id }),
          data: expect.objectContaining({ status: 'ATIVO' }),
        }),
      );
      expect(result.status).toBe('ATIVO');
    });

    it('should throw BadRequestException if Player.status is not AUSENTE', async () => {
      const activePlayer = { ...suspendedPlayer, status: 'ATIVO' };
      mockPrisma.groupMember.findFirst.mockResolvedValue(suspendedMember);
      mockPrisma.player.findFirst.mockResolvedValue(activePlayer);

      await expect(service.reactivateMember(groupId, memberId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.reactivateMember(groupId, memberId)).rejects.toThrow(
        'Membro não está suspenso',
      );
    });
  });
});

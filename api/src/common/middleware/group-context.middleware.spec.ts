import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GroupContextMiddleware } from './group-context.middleware';
import { PrismaService } from '../../prisma/prisma.service';

describe('GroupContextMiddleware', () => {
  let middleware: GroupContextMiddleware;
  let prisma: { groupMember: { findFirst: jest.Mock } };
  let mockNext: jest.Mock;

  const userId = 1;

  function createMockRequest(headers: Record<string, string> = {}, user = { id: userId }) {
    return {
      user,
      headers,
      header: jest.fn((name: string) => headers[name.toLowerCase()]),
    };
  }

  function createMockResponse() {
    return {};
  }

  beforeEach(() => {
    prisma = {
      groupMember: {
        findFirst: jest.fn(),
      },
    };

    middleware = new GroupContextMiddleware(prisma as unknown as PrismaService);
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when X-Group-Id header is not present', () => {
    it('should call next() without setting groupContext (passthrough)', async () => {
      const req = createMockRequest();
      const res = createMockResponse();

      await middleware.use(req as any, res as any, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(req).not.toHaveProperty('groupContext');
    });
  });

  describe('when X-Group-Id header is present and valid', () => {
    const groupId = 10;
    const activeMembership = {
      id: 1,
      groupId,
      userId,
      playerId: 42,
      role: 'ADMIN',
      isActive: true,
      group: {
        id: groupId,
        name: 'Test Group',
        isActive: true,
      },
    };

    it('should inject groupContext and call next() when user is an active member', async () => {
      prisma.groupMember.findFirst.mockResolvedValue(activeMembership);

      const req = createMockRequest({ 'x-group-id': String(groupId) });
      const res = createMockResponse();

      await middleware.use(req as any, res as any, mockNext);

      expect(prisma.groupMember.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            groupId,
            userId,
            isActive: true,
          }),
          include: expect.objectContaining({
            group: true,
          }),
        }),
      );

      expect(mockNext).toHaveBeenCalled();
      expect((req as any).groupContext).toEqual({
        groupId,
        groupRole: 'ADMIN',
        userId,
        playerId: 42,
      });
    });

    it('should throw ForbiddenException when user is NOT a member of the group', async () => {
      prisma.groupMember.findFirst.mockResolvedValue(null);

      const req = createMockRequest({ 'x-group-id': String(groupId) });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when membership is inactive (isActive=false)', async () => {
      // findFirst with isActive: true will return null for inactive memberships
      prisma.groupMember.findFirst.mockResolvedValue(null);

      const req = createMockRequest({ 'x-group-id': String(groupId) });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when group is inactive (group.isActive=false)', async () => {
      const inactiveGroupMembership = {
        ...activeMembership,
        group: {
          ...activeMembership.group,
          isActive: false,
        },
      };
      prisma.groupMember.findFirst.mockResolvedValue(inactiveGroupMembership);

      const req = createMockRequest({ 'x-group-id': String(groupId) });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('when X-Group-Id header is invalid', () => {
    it('should throw BadRequestException for non-numeric value', async () => {
      const req = createMockRequest({ 'x-group-id': 'abc' });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for empty string', async () => {
      const req = createMockRequest({ 'x-group-id': '' });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for floating-point value', async () => {
      const req = createMockRequest({ 'x-group-id': '3.14' });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for negative value', async () => {
      const req = createMockRequest({ 'x-group-id': '-1' });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for zero', async () => {
      const req = createMockRequest({ 'x-group-id': '0' });
      const res = createMockResponse();

      await expect(middleware.use(req as any, res as any, mockNext)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('groupContext shape', () => {
    it('should include all required fields with correct values', async () => {
      const membership = {
        id: 5,
        groupId: 20,
        userId,
        playerId: 99,
        role: 'DONO',
        isActive: true,
        group: {
          id: 20,
          name: 'Owner Group',
          isActive: true,
        },
      };
      prisma.groupMember.findFirst.mockResolvedValue(membership);

      const req = createMockRequest({ 'x-group-id': '20' });
      const res = createMockResponse();

      await middleware.use(req as any, res as any, mockNext);

      const ctx = (req as any).groupContext;
      expect(ctx).toBeDefined();
      expect(ctx.groupId).toBe(20);
      expect(ctx.groupRole).toBe('DONO');
      expect(ctx.userId).toBe(userId);
      expect(ctx.playerId).toBe(99);
    });

    it('should set playerId to null when member has no linked player', async () => {
      const membershipWithoutPlayer = {
        id: 6,
        groupId: 30,
        userId,
        playerId: null,
        role: 'JOGADOR',
        isActive: true,
        group: {
          id: 30,
          name: 'No Player Group',
          isActive: true,
        },
      };
      prisma.groupMember.findFirst.mockResolvedValue(membershipWithoutPlayer);

      const req = createMockRequest({ 'x-group-id': '30' });
      const res = createMockResponse();

      await middleware.use(req as any, res as any, mockNext);

      const ctx = (req as any).groupContext;
      expect(ctx.playerId).toBeNull();
    });
  });
});

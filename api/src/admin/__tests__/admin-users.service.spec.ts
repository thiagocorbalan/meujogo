import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AdminUsersService } from '../users/admin-users.service';
import { PrismaService } from '../../prisma/prisma.service';
import { type ListUsersDto } from '../users/dto/list-users.dto';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prismaService: any;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USUARIO',
    isSuperAdmin: false,
    isSuspended: false,
    suspendedReason: null,
    lastLoginAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        count: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      attendance: {
        count: jest.fn(),
      },
      adminAuditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('impersonation-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AdminUsersService>(AdminUsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated results', async () => {
      const users = [mockUser, { ...mockUser, id: 2, name: 'User 2' }];
      prismaService.user.count.mockResolvedValue(25);
      prismaService.user.findMany.mockResolvedValue(users);

      const query: ListUsersDto = { page: 1, limit: 10 };
      const result = await service.listUsers(query);

      expect(result.data).toEqual(users);
      expect(result.meta).toEqual({
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
      });
    });

    it('should calculate correct skip based on page and limit', async () => {
      prismaService.user.count.mockResolvedValue(100);
      prismaService.user.findMany.mockResolvedValue([]);

      const query: ListUsersDto = { page: 3, limit: 10 };
      await service.listUsers(query);

      expect(prismaService.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
    });

    it('should filter by ACTIVE status (isSuspended=false)', async () => {
      prismaService.user.count.mockResolvedValue(5);
      prismaService.user.findMany.mockResolvedValue([mockUser]);

      const query: ListUsersDto = { page: 1, limit: 25, status: 'ACTIVE' };
      await service.listUsers(query);

      expect(prismaService.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isSuspended: false }),
        }),
      );
    });

    it('should filter by SUSPENDED status (isSuspended=true)', async () => {
      prismaService.user.count.mockResolvedValue(2);
      prismaService.user.findMany.mockResolvedValue([]);

      const query: ListUsersDto = { page: 1, limit: 25, status: 'SUSPENDED' };
      await service.listUsers(query);

      expect(prismaService.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isSuspended: true }),
        }),
      );
    });

    it('should apply search filter as OR on name and email', async () => {
      prismaService.user.count.mockResolvedValue(1);
      prismaService.user.findMany.mockResolvedValue([mockUser]);

      const query: ListUsersDto = { page: 1, limit: 25, search: 'test' };
      await service.listUsers(query);

      expect(prismaService.user.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'test', mode: 'insensitive' } },
              { email: { contains: 'test', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should calculate totalPages correctly', async () => {
      prismaService.user.count.mockResolvedValue(101);
      prismaService.user.findMany.mockResolvedValue([]);

      const query: ListUsersDto = { page: 1, limit: 25 };
      const result = await service.listUsers(query);

      expect(result.meta.totalPages).toBe(5); // ceil(101/25) = 5
    });
  });

  describe('suspendUser', () => {
    it('should set isSuspended=true and write audit log in a transaction', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      // user.update and adminAuditLog.create are called *before* $transaction receives them;
      // mock them to return sentinel values so $transaction receives a non-empty array
      const updateResult = { id: 1, isSuspended: true };
      const auditResult = { id: 10, action: 'USER_SUSPENDED' };
      prismaService.user.update.mockReturnValue(updateResult);
      prismaService.adminAuditLog.create.mockReturnValue(auditResult);
      prismaService.$transaction.mockResolvedValue([updateResult, auditResult]);

      const result = await service.suspendUser(1, 'Spam', 99, '127.0.0.1');

      expect(result).toEqual({
        success: true,
        message: 'Usuário suspenso com sucesso',
      });
      expect(prismaService.$transaction).toHaveBeenCalledWith([
        updateResult,
        auditResult,
      ]);
    });

    it('should pass correct data to user.update inside transaction', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const updateCall = {
        where: { id: 1 },
        data: { isSuspended: true, suspendedReason: 'Spam' },
      };
      const auditCall = {
        data: {
          adminId: 99,
          action: 'USER_SUSPENDED',
          targetType: 'User',
          targetId: 1,
          metadata: { reason: 'Spam' },
          ipAddress: '127.0.0.1',
        },
      };

      prismaService.user.update.mockReturnValue(updateCall);
      prismaService.adminAuditLog.create.mockReturnValue(auditCall);
      prismaService.$transaction.mockImplementation((ops: any[]) =>
        Promise.resolve(ops),
      );

      await service.suspendUser(1, 'Spam', 99, '127.0.0.1');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isSuspended: true, suspendedReason: 'Spam' },
      });
      expect(prismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminId: 99,
          action: 'USER_SUSPENDED',
          targetType: 'User',
          targetId: 1,
          metadata: { reason: 'Spam' },
          ipAddress: '127.0.0.1',
        }),
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.suspendUser(999, 'reason', 1, undefined),
      ).rejects.toThrow(NotFoundException);
      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should use null for ipAddress when ip is undefined', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.adminAuditLog.create.mockReturnValue({});
      prismaService.user.update.mockReturnValue({});
      prismaService.$transaction.mockImplementation((ops: any[]) =>
        Promise.resolve(ops),
      );

      await service.suspendUser(1, 'reason', 99, undefined);

      expect(prismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ ipAddress: null }),
      });
    });
  });

  describe('impersonateUser', () => {
    it('should throw ForbiddenException when target user is a superadmin', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 2,
        role: 'USUARIO',
        isSuperAdmin: true,
      });

      await expect(service.impersonateUser(2, 1)).rejects.toThrow(
        ForbiddenException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException with correct message for superadmin target', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        id: 2,
        role: 'USUARIO',
        isSuperAdmin: true,
      });

      await expect(service.impersonateUser(2, 1)).rejects.toThrow(
        'Não é possível impersonar um superadmin',
      );
    });

    it('should throw NotFoundException when target user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.impersonateUser(999, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return a signed token for a non-superadmin target', async () => {
      const targetUser = { id: 5, role: 'USUARIO', isSuperAdmin: false };
      prismaService.user.findUnique.mockResolvedValue(targetUser);
      prismaService.adminAuditLog.create.mockResolvedValue({});
      (jwtService.sign as jest.Mock).mockReturnValue('impersonation-token');

      const result = await service.impersonateUser(5, 99);

      expect(result).toEqual({ token: 'impersonation-token' });
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          sub: 5,
          impersonatedBy: 99,
          role: 'USUARIO',
          isSuperAdmin: false,
        },
        expect.objectContaining({ expiresIn: '30m' }),
      );
    });

    it('should write audit log after issuing impersonation token', async () => {
      const targetUser = { id: 5, role: 'USUARIO', isSuperAdmin: false };
      prismaService.user.findUnique.mockResolvedValue(targetUser);
      prismaService.adminAuditLog.create.mockResolvedValue({});

      await service.impersonateUser(5, 99);

      expect(prismaService.adminAuditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          adminId: 99,
          action: 'USER_IMPERSONATED',
          targetType: 'User',
          targetId: 5,
        }),
      });
    });
  });
});

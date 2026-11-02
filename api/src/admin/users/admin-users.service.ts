import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ListUsersDto } from './dto/list-users.dto.js';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async listUsers(query: ListUsersDto) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === 'ACTIVE') {
      where.isSuspended = false;
    } else if (status === 'SUSPENDED') {
      where.isSuspended = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isSuperAdmin: true,
          isSuspended: true,
          suspendedReason: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUser(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isSuperAdmin: true,
        isSuspended: true,
        suspendedReason: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        memberships: {
          include: {
            group: {
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
                isSuspended: true,
              },
            },
          },
        },
        _count: {
          select: {
            players: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuário #${id} não encontrado`);
    }

    // Count attendances via players linked to this user
    const attendanceCount = await this.prisma.attendance.count({
      where: {
        player: {
          userId: id,
        },
      },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      memberships: user.memberships.map((m) => ({
        id: m.id,
        groupId: m.groupId,
        role: m.role,
        isActive: m.isActive,
        group: m.group,
      })),
      attendanceCount,
    };
  }

  async suspendUser(
    id: number,
    reason: string,
    adminId: number,
    ip: string | undefined,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário #${id} não encontrado`);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isSuspended: true, suspendedReason: reason },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'USER_SUSPENDED',
          targetType: 'User',
          targetId: id,
          metadata: { reason },
          ipAddress: ip ?? null,
        },
      }),
    ]);

    return { success: true, message: 'Usuário suspenso com sucesso' };
  }

  async unsuspendUser(id: number, adminId: number, ip: string | undefined) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`Usuário #${id} não encontrado`);
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { isSuspended: false, suspendedReason: null },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'USER_UNSUSPENDED',
          targetType: 'User',
          targetId: id,
          metadata: {},
          ipAddress: ip ?? null,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Suspensão do usuário removida com sucesso',
    };
  }

  async impersonateUser(targetId: number, adminId: number) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetId },
      select: {
        id: true,
        role: true,
        isSuperAdmin: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException(`Usuário #${targetId} não encontrado`);
    }

    if (targetUser.isSuperAdmin) {
      throw new ForbiddenException('Não é possível impersonar um superadmin');
    }

    const token = this.jwtService.sign(
      {
        sub: targetId,
        impersonatedBy: adminId,
        role: targetUser.role,
        isSuperAdmin: false,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: '30m',
      },
    );

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'USER_IMPERSONATED',
        targetType: 'User',
        targetId,
        metadata: {},
      },
    });

    return { token };
  }
}

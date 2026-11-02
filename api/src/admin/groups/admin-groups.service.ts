import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ListGroupsDto } from './dto/list-groups.dto.js';

@Injectable()
export class AdminGroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async listGroups(query: ListGroupsDto) {
    const { page, limit, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === 'active') {
      where.isSuspended = false;
    } else if (status === 'suspended') {
      where.isSuspended = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        {
          members: {
            some: {
              role: 'DONO',
              isActive: true,
              user: { email: { contains: search, mode: 'insensitive' } },
            },
          },
        },
      ];
    }

    const [total, groups] = await Promise.all([
      this.prisma.group.count({ where }),
      this.prisma.group.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          members: {
            where: { role: 'DONO', isActive: true },
            include: { user: { select: { email: true } } },
            take: 1,
          },
          plan: { select: { name: true } },
          _count: {
            select: { members: { where: { isActive: true } }, sessions: true },
          },
          sessions: {
            select: { createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    const data = groups.map((g) => ({
      id: g.id,
      name: g.name,
      ownerEmail: g.members[0]?.user?.email ?? null,
      memberCount: g._count.members,
      planName: g.plan?.name ?? null,
      totalSessions: g._count.sessions,
      lastSessionAt: g.sessions[0]?.createdAt ?? null,
      isSuspended: g.isSuspended,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getGroup(id: number) {
    const group = await this.prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        seasons: {
          orderBy: { startDate: 'desc' },
          include: {
            _count: { select: { sessions: true } },
          },
        },
        settings: true,
        plan: true,
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Grupo #${id} não encontrado`);
    }

    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      isActive: group.isActive,
      isSuspended: group.isSuspended,
      suspendedReason: group.suspendedReason,
      planId: group.planId,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      plan: group.plan,
      settings: group.settings,
      members: group.members.map((m) => ({
        id: m.id,
        role: m.role,
        userId: m.userId,
        playerId: m.playerId,
        name: m.user?.name ?? null,
        email: m.user?.email ?? null,
      })),
      seasons: group.seasons.map((s) => ({
        id: s.id,
        year: s.year,
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
        isClosed: s.isClosed,
        sessionCount: s._count.sessions,
      })),
      totalSessions: group._count.sessions,
    };
  }

  async suspendGroup(
    id: number,
    reason: string,
    adminId: number,
    ip: string | undefined,
  ) {
    const group = await this.prisma.group.findUnique({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Grupo #${id} não encontrado`);
    }

    await this.prisma.$transaction([
      this.prisma.group.update({
        where: { id },
        data: { isSuspended: true, suspendedReason: reason },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'GROUP_SUSPENDED',
          targetType: 'Group',
          targetId: id,
          metadata: { reason },
          ipAddress: ip ?? null,
        },
      }),
    ]);

    return { success: true, message: 'Grupo suspenso com sucesso' };
  }

  async reactivateGroup(id: number, adminId: number, ip: string | undefined) {
    const group = await this.prisma.group.findUnique({ where: { id } });

    if (!group) {
      throw new NotFoundException(`Grupo #${id} não encontrado`);
    }

    await this.prisma.$transaction([
      this.prisma.group.update({
        where: { id },
        data: { isSuspended: false, suspendedReason: null },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'GROUP_REACTIVATED',
          targetType: 'Group',
          targetId: id,
          metadata: {},
          ipAddress: ip ?? null,
        },
      }),
    ]);

    return { success: true, message: 'Grupo reativado com sucesso' };
  }
}

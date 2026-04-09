import { randomUUID } from 'crypto';

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private generateInviteCode(): string {
    return randomUUID().substring(0, 8);
  }

  async createGroup(
    userId: number,
    dto: {
      name: string;
      description?: string;
      dayOfWeek?: number;
      defaultTime?: string;
      address?: string;
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const slug = this.generateSlug(dto.name);
      const inviteCode = this.generateInviteCode();

      const group = await tx.group.create({
        data: {
          name: dto.name,
          slug,
          description: dto.description,
          dayOfWeek: dto.dayOfWeek,
          defaultTime: dto.defaultTime,
          address: dto.address,
          inviteCode,
        },
      });

      const settings = await tx.settings.create({
        data: {
          groupId: group.id,
        },
      });

      const player = await tx.player.create({
        data: {
          name: dto.name,
          position: 'LINHA',
          type: 'FIXO',
          groupId: group.id,
          userId,
        },
      });

      const member = await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId,
          playerId: player.id,
          role: 'DONO',
        },
      });

      return { group, settings, player, member };
    });
  }

  async findAllByUser(userId: number) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        group: {
          include: {
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
      },
    });

    return memberships
      .filter((m) => m.group.isActive)
      .map((m) => {
        const { _count, ...group } = m.group as any;
        return {
          ...group,
          role: m.role,
          playerId: m.playerId,
          memberCount: _count.members,
        };
      });
  }

  async findOne(groupId: number) {
    const group = await this.prisma.group.findFirst({
      where: {
        id: groupId,
        isActive: true,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Group #${groupId} not found`);
    }

    return group;
  }

  async update(
    groupId: number,
    dto: {
      name?: string;
      description?: string;
      dayOfWeek?: number;
      defaultTime?: string;
      address?: string;
    },
  ) {
    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        name: dto.name,
        description: dto.description,
        dayOfWeek: dto.dayOfWeek,
        defaultTime: dto.defaultTime,
        address: dto.address,
      },
    });
  }

  async softDelete(groupId: number) {
    return this.prisma.group.update({
      where: { id: groupId },
      data: { isActive: false },
    });
  }

  async getInviteInfo(inviteCode: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        inviteCode,
        isActive: true,
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(
        `Group with invite code '${inviteCode}' not found`,
      );
    }

    return group;
  }

  async joinViaInvite(
    inviteCode: string,
    userId: number,
    linkPlayerId?: number,
  ) {
    const group = await this.prisma.group.findFirst({
      where: {
        inviteCode,
        isActive: true,
      },
      include: {
        settings: true,
        _count: {
          select: { members: true },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(
        `Group with invite code '${inviteCode}' not found`,
      );
    }

    // Check if user is already a member
    const existingMember = await this.prisma.groupMember.findFirst({
      where: {
        groupId: group.id,
        userId,
        isActive: true,
      },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this group');
    }

    // Check if group is full
    const maxMembers =
      (group.settings?.maxTeams ?? 4) * (group.settings?.playersPerTeam ?? 5);
    if (group._count.members >= maxMembers) {
      throw new ForbiddenException('Group is full');
    }

    // Get user name for the player
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    let player;

    if (linkPlayerId) {
      // Link to existing guest player — preserve ELO, goals, games
      const guestPlayer = await this.prisma.player.findFirst({
        where: {
          id: linkPlayerId,
          groupId: group.id,
          type: 'CONVIDADO',
          userId: null,
        },
      });

      if (guestPlayer) {
        player = await this.prisma.player.update({
          where: { id: guestPlayer.id },
          data: {
            userId,
            type: 'FIXO',
            name: user?.name ?? guestPlayer.name,
          },
        });
      }
    }

    if (!player) {
      // No linkPlayerId or guest player not found — create new player
      player = await this.prisma.player.create({
        data: {
          name: user?.name ?? 'Jogador',
          position: 'LINHA',
          type: 'FIXO',
          groupId: group.id,
          userId,
        },
      });
    }

    const member = await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId,
        playerId: player.id,
        role: 'JOGADOR',
      },
    });

    return member;
  }

  async regenerateInviteCode(groupId: number) {
    const inviteCode = this.generateInviteCode();

    return this.prisma.group.update({
      where: { id: groupId },
      data: { inviteCode },
    });
  }

  async addGuestPlayer(
    groupId: number,
    dto: {
      name: string;
      position: string;
    },
  ) {
    const player = await this.prisma.player.create({
      data: {
        name: dto.name,
        position: dto.position as any,
        type: 'CONVIDADO',
        groupId,
      },
    });

    // Check for current session and create attendance if exists
    const currentSession = await this.prisma.session.findFirst({
      where: {
        groupId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (currentSession) {
      await this.prisma.attendance.create({
        data: {
          sessionId: currentSession.id,
          playerId: player.id,
          status: 'ATIVO',
        },
      });
    }

    return player;
  }

  async linkUserToPlayer(playerId: number, userId: number) {
    const player = await this.prisma.player.findFirst({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundException(`Player #${playerId} not found`);
    }

    return this.prisma.player.update({
      where: { id: playerId },
      data: { userId },
    });
  }

  async addMember(groupId: number, userId: number, role: string) {
    const player = await this.prisma.player.create({
      data: {
        name: 'Player',
        position: 'LINHA',
        type: 'FIXO',
        groupId,
        userId,
      },
    });

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
        playerId: player.id,
        role: role as any,
      },
    });
  }

  async removeMember(groupId: number, memberId: number) {
    return this.prisma.groupMember.update({
      where: { id: memberId },
      data: { isActive: false },
    });
  }

  async updateMemberRole(groupId: number, memberId: number, role: string) {
    return this.prisma.groupMember.update({
      where: { id: memberId },
      data: { role: role as any },
    });
  }

  async suspendMember(groupId: number, memberId: number) {
    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
    });

    if (!member) {
      throw new NotFoundException('Membro não encontrado');
    }

    if (member.role === 'DONO') {
      throw new ForbiddenException(
        'Não é possível suspender o dono do grupo',
      );
    }

    if (!member.playerId) {
      throw new NotFoundException('Jogador não encontrado para este membro');
    }

    const player = await this.prisma.player.findFirst({
      where: { id: member.playerId },
    });

    if (!player) {
      throw new NotFoundException('Jogador não encontrado');
    }

    if (player.status === 'AUSENTE') {
      throw new BadRequestException('Membro já está suspenso');
    }

    return this.prisma.player.update({
      where: { id: player.id },
      data: { status: 'AUSENTE' },
    });
  }

  async reactivateMember(groupId: number, memberId: number) {
    const member = await this.prisma.groupMember.findFirst({
      where: { id: memberId, groupId },
    });

    if (!member) {
      throw new NotFoundException('Membro não encontrado');
    }

    if (!member.playerId) {
      throw new NotFoundException('Jogador não encontrado para este membro');
    }

    const player = await this.prisma.player.findFirst({
      where: { id: member.playerId },
    });

    if (!player || player.status !== 'AUSENTE') {
      throw new BadRequestException('Membro não está suspenso');
    }

    return this.prisma.player.update({
      where: { id: player.id },
      data: { status: 'ATIVO' },
    });
  }

  async leaveGroup(groupId: number, userId: number) {
    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        isActive: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    // If user is DONO, check there are other active DONOs
    if (membership.role === 'DONO') {
      const otherOwners = await this.prisma.groupMember.findMany({
        where: {
          groupId,
          role: 'DONO',
          isActive: true,
        },
      });

      // If this user is the only DONO, throw error
      if (otherOwners.length <= 1) {
        throw new BadRequestException(
          'Cannot leave group as sole owner. Transfer ownership first.',
        );
      }
    }

    return this.prisma.groupMember.update({
      where: { id: membership.id },
      data: { isActive: false },
    });
  }
}

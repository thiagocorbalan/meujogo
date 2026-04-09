import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(groupId: number) {
    return this.prisma.player.findMany({
      where: { groupId, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number, groupId: number) {
    const player = await this.prisma.player.findFirst({
      where: { id, groupId },
      include: {
        goalEvents: true,
        attendances: true,
      },
    });

    if (!player) {
      throw new NotFoundException(`Player #${id} not found`);
    }

    return player;
  }

  async findMe(userId: number, groupId: number) {
    const player = await this.prisma.player.findFirst({
      where: { userId, groupId, isActive: true },
    });

    if (!player) {
      throw new NotFoundException(
        'No player profile found for this user in the current group',
      );
    }

    return player;
  }

  async updateMe(
    userId: number,
    groupId: number,
    dto: { name?: string; position?: string; status?: string },
  ) {
    const player = await this.prisma.player.findFirst({
      where: { userId, groupId },
    });

    if (!player) {
      throw new NotFoundException('Perfil não encontrado neste grupo');
    }

    return this.prisma.player.update({
      where: { id: player.id },
      data: {
        name: dto.name,
        position: dto.position as any,
        status: dto.status as any,
      },
    });
  }

  async create(dto: CreatePlayerDto, groupId: number) {
    const settings = await this.prisma.settings.findFirst({
      where: { groupId },
    });
    const defaultElo = settings?.defaultElo ?? 1200;

    return this.prisma.player.create({
      data: {
        name: dto.name,
        position: dto.position,
        type: dto.type,
        isActive: true,
        elo: defaultElo,
        goals: 0,
        games: 0,
        groupId,
      },
    });
  }

  async update(id: number, dto: UpdatePlayerDto, groupId: number) {
    const player = await this.prisma.player.findFirst({
      where: { id, groupId },
    });

    if (!player || !player.isActive) {
      throw new NotFoundException(`Player #${id} not found`);
    }

    return this.prisma.player.update({
      where: { id },
      data: {
        name: dto.name,
        position: dto.position,
        type: dto.type,
        status: dto.status,
      },
    });
  }

  async remove(id: number, groupId: number) {
    const player = await this.prisma.player.findFirst({
      where: { id, groupId },
    });

    if (!player || !player.isActive) {
      throw new NotFoundException(`Player #${id} not found`);
    }

    return this.prisma.player.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

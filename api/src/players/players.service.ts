import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.player.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const player = await this.prisma.player.findUnique({
      where: { id },
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

  async create(dto: CreatePlayerDto) {
    const settings = await this.prisma.settings.findUnique({
      where: { id: 1 },
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
      },
    });
  }

  async update(id: number, dto: UpdatePlayerDto) {
    const player = await this.prisma.player.findUnique({ where: { id } });

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

  async remove(id: number) {
    const player = await this.prisma.player.findUnique({ where: { id } });

    if (!player || !player.isActive) {
      throw new NotFoundException(`Player #${id} not found`);
    }

    return this.prisma.player.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeasonDto } from './dto/create-season.dto';

@Injectable()
export class SeasonsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(groupId: number) {
    return this.prisma.season.findMany({
      where: { groupId },
      include: { sessions: true },
      orderBy: { year: 'desc' },
    });
  }

  async findOne(id: number, groupId: number) {
    const season = await this.prisma.season.findFirst({
      where: { id, groupId },
      include: { sessions: true },
    });

    if (!season) {
      throw new NotFoundException(`Season #${id} not found`);
    }

    return season;
  }

  create(dto: CreateSeasonDto, groupId: number) {
    return this.prisma.season.create({
      data: {
        year: dto.year,
        startDate: new Date(dto.startDate),
        isClosed: false,
        groupId,
      },
    });
  }

  async close(id: number, groupId: number) {
    const season = await this.prisma.season.findFirst({
      where: { id, groupId },
    });

    if (!season) {
      throw new NotFoundException(`Season #${id} not found`);
    }

    if (season.isClosed) {
      throw new BadRequestException('Season is already closed');
    }

    return this.prisma.season.update({
      where: { id },
      data: {
        endDate: new Date(),
        isClosed: true,
      },
    });
  }

  async closeAndCreateNew(groupId: number) {
    return this.prisma.$transaction(async (tx) => {
      const openSeason = await tx.season.findFirst({
        where: { isClosed: false, groupId },
      });

      if (openSeason) {
        await tx.season.update({
          where: { id: openSeason.id },
          data: {
            isClosed: true,
            endDate: new Date(),
          },
        });
      }

      return tx.season.create({
        data: {
          year: new Date().getFullYear(),
          startDate: new Date(),
          isClosed: false,
          groupId,
        },
      });
    });
  }
}

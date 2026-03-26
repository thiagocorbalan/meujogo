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

  findAll() {
    return this.prisma.season.findMany({
      include: { sessions: true },
      orderBy: { year: 'desc' },
    });
  }

  async findOne(id: number) {
    const season = await this.prisma.season.findUnique({
      where: { id },
      include: { sessions: true },
    });

    if (!season) {
      throw new NotFoundException(`Season #${id} not found`);
    }

    return season;
  }

  create(dto: CreateSeasonDto) {
    return this.prisma.season.create({
      data: {
        year: dto.year,
        startDate: new Date(dto.startDate),
        isClosed: false,
      },
    });
  }

  async close(id: number) {
    const season = await this.prisma.season.findUnique({ where: { id } });

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
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.settings.findUnique({
      where: { id: 1 },
      include: { vests: true },
    });

    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { id: 1 },
        include: { vests: true },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto) {
    const { vests, ...rest } = dto;

    if (vests !== undefined) {
      return this.prisma.$transaction(async (tx) => {
        await tx.vest.deleteMany({ where: { settingsId: 1 } });

        return tx.settings.update({
          where: { id: 1 },
          data: {
            ...rest,
            vests: {
              create: vests.map((v) => ({ name: v.name, color: v.color })),
            },
          },
          include: { vests: true },
        });
      });
    }

    return this.prisma.settings.update({
      where: { id: 1 },
      data: rest,
      include: { vests: true },
    });
  }

  async resetData() {
    await this.prisma.$transaction(async (tx) => {
      await tx.goal.deleteMany();
      await tx.matchEvent.deleteMany();
      await tx.match.deleteMany();
      await tx.champion.deleteMany();
      await tx.teamPlayer.deleteMany();
      await tx.team.deleteMany();
      await tx.attendance.deleteMany();
      await tx.session.deleteMany();
      await tx.season.deleteMany();
      await tx.player.deleteMany();
    });

    return { message: 'Dados resetados com sucesso.' };
  }
}

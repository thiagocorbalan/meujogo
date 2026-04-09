import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings(groupId: number) {
    let settings = await this.prisma.settings.findUnique({
      where: { groupId },
      include: { vests: true },
    });

    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { groupId },
        include: { vests: true },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto, groupId: number) {
    const { vests, ...rest } = dto;

    // Ensure settings exist for this group
    let settings = await this.prisma.settings.findUnique({
      where: { groupId },
    });

    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { groupId },
      });
    }

    if (vests !== undefined) {
      return this.prisma.$transaction(async (tx) => {
        await tx.vest.deleteMany({ where: { settingsId: settings.id } });

        return tx.settings.update({
          where: { id: settings.id },
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
      where: { id: settings.id },
      data: rest,
      include: { vests: true },
    });
  }

  async resetData(groupId: number) {
    await this.prisma.$transaction(async (tx) => {
      await tx.goal.deleteMany({ where: { match: { session: { groupId } } } });
      await tx.matchEvent.deleteMany({ where: { match: { session: { groupId } } } });
      await tx.match.deleteMany({ where: { session: { groupId } } });
      await tx.champion.deleteMany({ where: { session: { groupId } } });
      await tx.teamPlayer.deleteMany({ where: { team: { session: { groupId } } } });
      await tx.team.deleteMany({ where: { session: { groupId } } });
      await tx.attendance.deleteMany({ where: { session: { groupId } } });
      await tx.session.deleteMany({ where: { groupId } });
      await tx.season.deleteMany({ where: { groupId } });
      await tx.player.deleteMany({ where: { groupId } });
    });

    return { message: 'Dados resetados com sucesso.' };
  }
}

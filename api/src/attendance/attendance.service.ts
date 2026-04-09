import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MatchEventType, PlayerStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findBySession(sessionId: number, groupId: number, search?: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });

    if (!session) {
      throw new NotFoundException(`Session #${sessionId} not found`);
    }

    await this.syncMissingPlayers(sessionId, groupId);

    return this.prisma.attendance.findMany({
      where: {
        sessionId,
        player: {
          isActive: true,
          groupId,
          ...(search
            ? { name: { contains: search, mode: 'insensitive' as const } }
            : {}),
        },
      },
      include: { player: true },
      orderBy: { player: { name: 'asc' } },
    });
  }

  private async syncMissingPlayers(sessionId: number, groupId: number) {
    const existing = await this.prisma.attendance.findMany({
      where: { sessionId },
      select: { playerId: true },
    });
    const existingIds = new Set(existing.map((a) => a.playerId));

    const fixoPlayers = await this.prisma.player.findMany({
      where: { isActive: true, type: 'FIXO', groupId },
      select: { id: true },
    });

    const missing = fixoPlayers.filter((p) => !existingIds.has(p.id));
    if (missing.length === 0) return;

    await this.prisma.attendance.createMany({
      data: missing.map((p) => ({
        sessionId,
        playerId: p.id,
        status: 'AUSENTE' as const,
      })),
      skipDuplicates: true,
    });
  }

  async update(
    sessionId: number,
    playerId: number,
    dto: UpdateAttendanceDto,
    groupId: number,
  ) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });

    if (!session) {
      throw new NotFoundException(`Session #${sessionId} not found`);
    }

    const liveMatch = await this.prisma.match.findFirst({
      where: {
        sessionId,
        events: {
          some: { type: MatchEventType.MATCH_STARTED },
          none: { type: MatchEventType.MATCH_ENDED },
        },
      },
    });

    if (liveMatch) {
      throw new ForbiddenException(
        'Não é possível alterar presença durante partida ao vivo',
      );
    }

    const player = await this.prisma.player.findFirst({
      where: { id: playerId, groupId },
    });

    if (!player || !player.isActive) {
      throw new NotFoundException(`Player #${playerId} not found`);
    }

    return this.prisma.attendance.upsert({
      where: { sessionId_playerId: { sessionId, playerId } },
      create: { sessionId, playerId, status: dto.status },
      update: { status: dto.status },
    });
  }

  async updateOwnStatus(
    sessionId: number,
    userId: number,
    groupId: number,
    status: PlayerStatus,
  ) {
    if (status !== PlayerStatus.ATIVO && status !== PlayerStatus.AUSENTE) {
      throw new BadRequestException(
        'Self-service attendance only allows ATIVO or AUSENTE status',
      );
    }

    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });

    if (!session) {
      throw new NotFoundException(`Session #${sessionId} not found`);
    }

    const liveMatch = await this.prisma.match.findFirst({
      where: {
        sessionId,
        events: {
          some: { type: MatchEventType.MATCH_STARTED },
          none: { type: MatchEventType.MATCH_ENDED },
        },
      },
    });

    if (liveMatch) {
      throw new ForbiddenException(
        'Não é possível alterar presença durante partida ao vivo',
      );
    }

    const player = await this.prisma.player.findFirst({
      where: { userId, groupId, isActive: true },
    });

    if (!player) {
      throw new NotFoundException(
        'No player profile found for this user in the current group',
      );
    }

    return this.prisma.attendance.upsert({
      where: {
        sessionId_playerId: { sessionId, playerId: player.id },
      },
      create: { sessionId, playerId: player.id, status },
      update: { status },
    });
  }
}

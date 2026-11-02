import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PlayerStatus,
  SubstitutionReason,
  SubstitutionType,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubstitutionDto } from './dto/create-substitution.dto';

export interface PoolPlayer {
  id: number;
  name: string;
}

export interface WaitingTeam {
  team: { id: number; name: string; color: string };
  players: PoolPlayer[];
}

export interface AvailablePool {
  reserves: PoolPlayer[];
  waitingTeams: WaitingTeam[];
}

@Injectable()
export class SubstitutionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(sessionId: number, dto: CreateSubstitutionDto, groupId: number) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });
    if (!session)
      throw new NotFoundException(`Session #${sessionId} not found`);
    if (session.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Sessao deve estar em andamento para realizar substituicao.',
      );
    }

    const activeMatch = await this.prisma.match.findFirst({
      where: {
        sessionId,
        events: { some: { type: 'MATCH_STARTED' } },
        NOT: { events: { some: { type: 'MATCH_ENDED' } } },
      },
    });

    if (dto.type === 'TEMPORARIA' && !activeMatch) {
      throw new BadRequestException(
        'Substituicao TEMPORARIA exige uma partida ativa.',
      );
    }

    const inAttendance = await this.prisma.attendance.findFirst({
      where: { sessionId, playerId: dto.playerInId },
    });
    if (
      inAttendance &&
      (inAttendance.status === 'AUSENTE' || inAttendance.status === 'LESIONADO')
    ) {
      throw new BadRequestException(
        'Jogador nao esta disponivel para entrar em campo.',
      );
    }

    if (activeMatch) {
      const inActiveTeams = await this.prisma.teamPlayer.findFirst({
        where: {
          playerId: dto.playerInId,
          teamId: { in: [activeMatch.teamAId, activeMatch.teamBId] },
        },
      });
      if (inActiveTeams) {
        throw new BadRequestException('Jogador ja esta jogando esta partida.');
      }
    }

    const sourceTeamPlayer = await this.prisma.teamPlayer.findFirst({
      where: { playerId: dto.playerInId, team: { sessionId } },
    });
    const sourceTeamId = sourceTeamPlayer?.teamId ?? null;

    const targetMatchId = activeMatch ? activeMatch.id : null;
    const minute = activeMatch ? (dto.minute ?? null) : null;

    return this.prisma.$transaction(async (tx) => {
      const substitution = await tx.substitution.create({
        data: {
          sessionId,
          matchId: targetMatchId,
          teamId: dto.teamId,
          sourceTeamId,
          playerOutId: dto.playerOutId,
          playerInId: dto.playerInId,
          type: dto.type,
          reason: dto.reason,
          minute,
        },
      });

      if (activeMatch) {
        await tx.matchPlayer.updateMany({
          where: { matchId: activeMatch.id, playerId: dto.playerOutId },
          data: { leftMinute: minute },
        });
        await tx.matchPlayer.create({
          data: {
            matchId: activeMatch.id,
            playerId: dto.playerInId,
            teamId: dto.teamId,
            isStarter: false,
            enteredMinute: minute,
          },
        });

        await tx.matchEvent.create({
          data: {
            matchId: activeMatch.id,
            type: 'PLAYER_SUBSTITUTED',
            payload: {
              substitutionId: substitution.id,
              teamId: dto.teamId,
              playerOutId: dto.playerOutId,
              playerInId: dto.playerInId,
              type: dto.type,
              reason: dto.reason,
              minute,
            },
          },
        });
      }

      if (dto.type === 'PERMANENTE') {
        await tx.teamPlayer.deleteMany({
          where: { teamId: dto.teamId, playerId: dto.playerOutId },
        });
        if (sourceTeamId !== null) {
          await tx.teamPlayer.deleteMany({
            where: { teamId: sourceTeamId, playerId: dto.playerInId },
          });
        }
        await tx.teamPlayer.create({
          data: { teamId: dto.teamId, playerId: dto.playerInId },
        });
      }

      const outStatus = this.attendanceStatusForOutgoing(dto.reason);
      await tx.attendance.updateMany({
        where: { sessionId, playerId: dto.playerOutId },
        data: { status: outStatus },
      });
      await tx.attendance.updateMany({
        where: { sessionId, playerId: dto.playerInId },
        data: { status: 'ATIVO' },
      });

      return substitution;
    });
  }

  private attendanceStatusForOutgoing(
    reason: SubstitutionReason,
  ): PlayerStatus {
    if (reason === 'LESAO') return 'LESIONADO';
    return 'RESERVA';
  }

  findBySession(sessionId: number, groupId: number) {
    return this.prisma.substitution.findMany({
      where: { sessionId, session: { groupId } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAvailablePool(
    sessionId: number,
    groupId: number,
  ): Promise<AvailablePool> {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });
    if (!session)
      throw new NotFoundException(`Session #${sessionId} not found`);

    const activeMatch = await this.prisma.match.findFirst({
      where: {
        sessionId,
        events: { some: { type: 'MATCH_STARTED' } },
        NOT: { events: { some: { type: 'MATCH_ENDED' } } },
      },
    });

    const teams = await this.prisma.team.findMany({
      where: { sessionId },
      include: { players: { include: { player: true } } },
    });

    const reservesAttendance = await this.prisma.attendance.findMany({
      where: { sessionId, status: 'RESERVA' },
      include: { player: true },
    });

    const availableAttendance = await this.prisma.attendance.findMany({
      where: { sessionId, status: { in: ['ATIVO', 'RESERVA'] } },
      select: { playerId: true },
    });
    const availableIds = new Set(availableAttendance.map((a) => a.playerId));

    const onFieldPlayerIds = new Set<number>();
    const benchedInActiveMatchIds = new Set<number>();
    if (activeMatch) {
      const currentMatchPlayers = await this.prisma.matchPlayer.findMany({
        where: { matchId: activeMatch.id },
        select: { playerId: true, leftMinute: true },
      });
      for (const mp of currentMatchPlayers) {
        if (mp.leftMinute === null) {
          onFieldPlayerIds.add(mp.playerId);
        } else {
          benchedInActiveMatchIds.add(mp.playerId);
        }
      }
    }

    const allocatedPlayerIds = new Set<number>();
    for (const team of teams) {
      for (const tp of team.players) {
        allocatedPlayerIds.add(tp.player.id);
      }
    }

    const reserves: PoolPlayer[] = reservesAttendance
      .filter((a) => !onFieldPlayerIds.has(a.playerId))
      .filter(
        (a) =>
          !allocatedPlayerIds.has(a.playerId) ||
          benchedInActiveMatchIds.has(a.playerId),
      )
      .map((a) => ({ id: a.player.id, name: a.player.name }));

    const waitingTeams: WaitingTeam[] = [];
    if (activeMatch && teams.length >= 3) {
      for (const team of teams) {
        if (team.id === activeMatch.teamAId || team.id === activeMatch.teamBId)
          continue;
        waitingTeams.push({
          team: { id: team.id, name: team.name, color: team.color },
          players: team.players
            .filter((tp) => !onFieldPlayerIds.has(tp.player.id))
            .filter((tp) => availableIds.has(tp.player.id))
            .map((tp) => ({
              id: tp.player.id,
              name: tp.player.name,
            })),
        });
      }
    }

    return { reserves, waitingTeams };
  }

  async undo(sessionId: number, substitutionId: number, groupId: number) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, groupId },
    });
    if (!session)
      throw new NotFoundException(`Session #${sessionId} not found`);

    const substitution = await this.prisma.substitution.findFirst({
      where: { id: substitutionId, sessionId },
    });
    if (!substitution) {
      throw new NotFoundException(`Substitution #${substitutionId} not found`);
    }
    if (substitution.isReverted) {
      throw new BadRequestException('Substituicao ja foi revertida.');
    }

    if (substitution.type === 'PERMANENTE' && substitution.matchId) {
      const originMatch = await this.prisma.match.findFirst({
        where: { id: substitution.matchId },
      });
      if (originMatch) {
        const laterStartedMatches = await this.prisma.match.findMany({
          where: {
            sessionId,
            matchOrder: { gt: originMatch.matchOrder },
            events: { some: { type: 'MATCH_STARTED' } },
          },
        });
        if (laterStartedMatches.length > 0) {
          throw new BadRequestException(
            'Nao e possivel desfazer PERMANENTE: partidas posteriores ja foram jogadas.',
          );
        }
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (substitution.matchId) {
        await tx.matchPlayer.deleteMany({
          where: {
            matchId: substitution.matchId,
            playerId: substitution.playerInId,
          },
        });
        await tx.matchPlayer.updateMany({
          where: {
            matchId: substitution.matchId,
            playerId: substitution.playerOutId,
          },
          data: { leftMinute: null },
        });
      }

      if (substitution.type === 'PERMANENTE') {
        await tx.teamPlayer.deleteMany({
          where: {
            teamId: substitution.teamId,
            playerId: substitution.playerInId,
          },
        });
        await tx.teamPlayer.create({
          data: {
            teamId: substitution.teamId,
            playerId: substitution.playerOutId,
          },
        });
        if (substitution.sourceTeamId !== null) {
          await tx.teamPlayer.create({
            data: {
              teamId: substitution.sourceTeamId,
              playerId: substitution.playerInId,
            },
          });
        }
      }

      await tx.attendance.updateMany({
        where: { sessionId, playerId: substitution.playerOutId },
        data: { status: 'ATIVO' },
      });
      await tx.attendance.updateMany({
        where: { sessionId, playerId: substitution.playerInId },
        data: { status: 'RESERVA' },
      });

      if (substitution.matchId) {
        await tx.matchEvent.create({
          data: {
            matchId: substitution.matchId,
            type: 'SUBSTITUTION_REVERTED',
            payload: {
              substitutionId: substitution.id,
              teamId: substitution.teamId,
              playerOutId: substitution.playerOutId,
              playerInId: substitution.playerInId,
            },
          },
        });
      }

      return tx.substitution.update({
        where: { id: substitution.id },
        data: { isReverted: true, revertedAt: new Date() },
      });
    });
  }
}

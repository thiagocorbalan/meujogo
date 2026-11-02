import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async listActive() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  async listAll() {
    return this.prisma.plan.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { groups: true } } },
    });
  }

  async create(dto: CreatePlanDto, adminId: number, ip: string | undefined) {
    const plan = await this.prisma.plan.create({
      data: {
        name: dto.name,
        priceMonthly: dto.priceMonthly,
        priceAnnual: dto.priceAnnual,
        maxPlayers: dto.maxPlayers ?? null,
        maxSessionsPerMonth: dto.maxSessionsPerMonth ?? null,
        features: dto.features ?? [],
        stripePriceIdMonthly: dto.stripePriceIdMonthly ?? null,
        stripePriceIdAnnual: dto.stripePriceIdAnnual ?? null,
        trialDays: dto.trialDays ?? 14,
        trialExpireBehavior: dto.trialExpireBehavior ?? 'CONVERT_TO_FREE',
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'PLAN_CREATED',
        targetType: 'Plan',
        targetId: plan.id,
        metadata: { name: plan.name },
        ipAddress: ip ?? null,
      },
    });

    return plan;
  }

  async update(
    id: number,
    dto: UpdatePlanDto,
    adminId: number,
    ip: string | undefined,
  ) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Plano #${id} não encontrado`);
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.priceMonthly !== undefined && {
          priceMonthly: dto.priceMonthly,
        }),
        ...(dto.priceAnnual !== undefined && { priceAnnual: dto.priceAnnual }),
        ...(dto.maxPlayers !== undefined && { maxPlayers: dto.maxPlayers }),
        ...(dto.maxSessionsPerMonth !== undefined && {
          maxSessionsPerMonth: dto.maxSessionsPerMonth,
        }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.stripePriceIdMonthly !== undefined && {
          stripePriceIdMonthly: dto.stripePriceIdMonthly,
        }),
        ...(dto.stripePriceIdAnnual !== undefined && {
          stripePriceIdAnnual: dto.stripePriceIdAnnual,
        }),
        ...(dto.trialDays !== undefined && { trialDays: dto.trialDays }),
        ...(dto.trialExpireBehavior !== undefined && {
          trialExpireBehavior: dto.trialExpireBehavior,
        }),
      },
    });

    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action: 'PLAN_UPDATED',
        targetType: 'Plan',
        targetId: id,
        metadata: { changes: dto } as unknown as Prisma.InputJsonValue,
        ipAddress: ip ?? null,
      },
    });

    return plan;
  }

  async remove(id: number, adminId: number, ip: string | undefined) {
    const existing = await this.prisma.plan.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Plano #${id} não encontrado`);
    }

    const groupCount = await this.prisma.group.count({ where: { planId: id } });

    if (groupCount > 0) {
      throw new ConflictException(
        `Não é possível remover o plano: ${groupCount} grupo(s) utilizam este plano`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.plan.update({
        where: { id },
        data: { isActive: false },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          adminId,
          action: 'PLAN_DELETED',
          targetType: 'Plan',
          targetId: id,
          metadata: { name: existing.name },
          ipAddress: ip ?? null,
        },
      }),
    ]);

    return { success: true, message: 'Plano desativado com sucesso' };
  }
}

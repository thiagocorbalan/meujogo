import { Injectable } from '@nestjs/common';
import { AuditLogAction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';

export interface AuditLogDto {
  adminId: number;
  action: AuditLogAction;
  targetType?: string;
  targetId?: number;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(dto: AuditLogDto): void {
    const data: Prisma.AdminAuditLogCreateInput = {
      admin: { connect: { id: dto.adminId } },
      action: dto.action,
      targetType: dto.targetType,
      targetId: dto.targetId,
      metadata: dto.metadata as Prisma.InputJsonValue,
      ipAddress: dto.ipAddress,
    };
    this.prisma.adminAuditLog
      .create({ data })
      .catch((err) => console.error('Audit log write failed:', err));
  }
}

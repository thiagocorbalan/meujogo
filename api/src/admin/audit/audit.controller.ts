import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAuditLog, AuditLogAction, Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard.js';
import { AuditService } from './audit.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

interface AuditLogListResult {
  data: AdminAuditLog[];
  total: number;
  page: number;
  limit: number;
}

@Controller('admin/audit')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  async findAll(
    @Query('page') pageParam?: string,
    @Query('limit') limitParam?: string,
    @Query('adminId') adminIdParam?: string,
    @Query('action') action?: AuditLogAction,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<AuditLogListResult> {
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AdminAuditLogWhereInput = {};

    if (adminIdParam !== undefined) {
      where.adminId = parseInt(adminIdParam, 10);
    }

    if (action !== undefined) {
      where.action = action;
    }

    if (from !== undefined || to !== undefined) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (from !== undefined) createdAt.gte = new Date(from);
      if (to !== undefined) createdAt.lte = new Date(to);
      where.createdAt = createdAt;
    }

    const [data, total] = await Promise.all([
      this.prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return { data, total, page, limit };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

type Period = 'day' | 'week' | 'month';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(period: Period = 'week') {
    const now = new Date();

    const periodStart = new Date(now);
    if (period === 'day') {
      periodStart.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      periodStart.setDate(now.getDate() - 7);
    } else {
      periodStart.setMonth(now.getMonth() - 1);
    }

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const ninetyDaysAgo = new Date(now);
    ninetyDaysAgo.setDate(now.getDate() - 90);

    const [
      totalUsers,
      totalLinhaPlayers,
      totalGoalkeepers,
      sessionsToday,
      sessionsThisWeek,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.player.count({ where: { position: 'LINHA' } }),
      this.prisma.player.count({ where: { position: 'GOLEIRO' } }),
      this.prisma.session.count({
        where: { createdAt: { gte: todayStart } },
      }),
      this.prisma.session.count({
        where: { createdAt: { gte: weekStart } },
      }),
    ]);

    // Active groups: groups with at least one session in last 30 days
    const activeGroupsResult = await this.prisma.session.groupBy({
      by: ['groupId'],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        groupId: { not: null },
      },
    });
    const activeGroups = activeGroupsResult.length;

    // New users chart: count per day over the period
    const newUsersRaw = await this.prisma.$queryRaw<
      Array<{ date: string; count: string }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS date,
        COUNT(*)::text AS count
      FROM users
      WHERE "createdAt" >= ${periodStart}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY DATE_TRUNC('day', "createdAt") ASC
    `;
    const newUsersChart = newUsersRaw.map((row) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));

    // Top 10 active groups with session count in last 30 days and owner email
    const topActiveGroupsRaw = await this.prisma.$queryRaw<
      Array<{
        groupId: number;
        groupName: string;
        ownerEmail: string | null;
        sessionCount: string;
      }>
    >`
      SELECT
        g.id AS "groupId",
        g.name AS "groupName",
        u.email AS "ownerEmail",
        COUNT(s.id)::text AS "sessionCount"
      FROM groups g
      LEFT JOIN sessions s ON s."groupId" = g.id AND s."createdAt" >= ${thirtyDaysAgo}
      LEFT JOIN group_members gm ON gm."groupId" = g.id AND gm.role = 'DONO'
      LEFT JOIN users u ON u.id = gm."userId"
      GROUP BY g.id, g.name, u.email
      HAVING COUNT(s.id) > 0
      ORDER BY COUNT(s.id) DESC
      LIMIT 10
    `;
    const topActiveGroups = topActiveGroupsRaw.map((row) => ({
      groupId: row.groupId,
      groupName: row.groupName,
      ownerEmail: row.ownerEmail,
      sessionCount: parseInt(row.sessionCount, 10),
    }));

    // Match heatmap: count per day of week (0=Sunday ... 6=Saturday) over last 90 days
    const heatmapRaw = await this.prisma.$queryRaw<
      Array<{ dow: string; count: string }>
    >`
      SELECT
        EXTRACT(DOW FROM "createdAt")::text AS dow,
        COUNT(*)::text AS count
      FROM matches
      WHERE "createdAt" >= ${ninetyDaysAgo}
      GROUP BY EXTRACT(DOW FROM "createdAt")
      ORDER BY EXTRACT(DOW FROM "createdAt") ASC
    `;

    const dowCountMap: Record<number, number> = {};
    for (const row of heatmapRaw) {
      dowCountMap[parseInt(row.dow, 10)] = parseInt(row.count, 10);
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const matchHeatmap = days.map((label, idx) => ({
      day: label,
      count: dowCountMap[idx] ?? 0,
    }));

    return {
      totalUsers,
      activeGroups,
      totalLinhaPlayers,
      totalGoalkeepers,
      sessionsToday,
      sessionsThisWeek,
      newUsersChart,
      topActiveGroups,
      matchHeatmap,
    };
  }

  async getStripeStats() {
    const config = await this.prisma.integrationConfig.findUnique({
      where: { service: 'STRIPE' },
    });

    if (!config?.isConfigured) {
      return { stripeConfigured: false };
    }

    // Actual Stripe integration comes in Phase 3
    return {
      stripeConfigured: true,
      mrr: null,
      subscribers: null,
      churnRate: null,
      trials: null,
    };
  }
}

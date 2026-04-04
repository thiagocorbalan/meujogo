import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import * as express from 'express';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @SkipThrottle()
  async check(@Res({ passthrough: true }) res: express.Response) {
    const dbOk = await this.checkDatabase();
    const status = dbOk ? 'healthy' : 'unhealthy';

    if (!dbOk) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE);
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbOk ? 'connected' : 'disconnected',
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

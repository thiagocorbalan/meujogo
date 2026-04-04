import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { CsrfGuard } from './common/guards/csrf.guard.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { HealthModule } from './health/health.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { PlayersModule } from './players/players.module.js';
import { UsersModule } from './users/users.module.js';
import { SeasonsModule } from './seasons/seasons.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { MatchesModule } from './matches/matches.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { RankingModule } from './ranking/ranking.module.js';
import { ChampionsModule } from './champions/champions.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { StatsModule } from './stats/stats.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60000,
          limit: 100,
        },
      ],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty', options: { colorize: true } }
            : undefined,
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        redact: ['req.headers.cookie', 'req.headers.authorization'],
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
          }),
        },
      },
    }),
    PrismaModule,
    HealthModule,
    SettingsModule,
    PlayersModule,
    UsersModule,
    SeasonsModule,
    SessionsModule,
    MatchesModule,
    TeamsModule,
    AttendanceModule,
    RankingModule,
    ChampionsModule,
    DashboardModule,
    UploadsModule,
    StatsModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SettingsModule } from './settings/settings.module';
import { PlayersModule } from './players/players.module';
import { UsersModule } from './users/users.module';
import { SeasonsModule } from './seasons/seasons.module';
import { SessionsModule } from './sessions/sessions.module';
import { MatchesModule } from './matches/matches.module';
import { TeamsModule } from './teams/teams.module';
import { AttendanceModule } from './attendance/attendance.module';
import { RankingModule } from './ranking/ranking.module';
import { ChampionsModule } from './champions/champions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { UploadsModule } from './uploads/uploads.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [PrismaModule, SettingsModule, PlayersModule, UsersModule, SeasonsModule, SessionsModule, MatchesModule, TeamsModule, AttendanceModule, RankingModule, ChampionsModule, DashboardModule, UploadsModule, StatsModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

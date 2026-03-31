import { Controller, Get, Post, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { DrawTeamsDto } from './dto/draw-teams.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('sessions/:sessionId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('draw')
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  draw(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: DrawTeamsDto,
  ) {
    return this.teamsService.draw(sessionId, body.mode);
  }

  @Get('teams')
  findBySession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.teamsService.findBySession(sessionId);
  }
}

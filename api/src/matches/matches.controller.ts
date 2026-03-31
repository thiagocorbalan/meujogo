import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { StartMatchDto } from './dto/start-match.dto';
import { RegisterGoalDto } from './dto/register-goal.dto';
import { EndMatchDto } from './dto/end-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('sessions/:sessionId/matches')
  findBySession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.matchesService.findBySession(sessionId);
  }

  @Post('sessions/:sessionId/matches/start')
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  start(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: StartMatchDto,
  ) {
    return this.matchesService.start(sessionId, dto);
  }

  @Patch('matches/:id/goal')
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  registerGoal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterGoalDto,
  ) {
    return this.matchesService.registerGoal(id, dto);
  }

  @Patch('matches/:id/end')
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  end(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndMatchDto,
  ) {
    return this.matchesService.end(id, dto);
  }

  @Get('sessions/:sessionId/matches/next')
  getNextMatch(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.matchesService.getNextMatch(sessionId);
  }
}

import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { StartMatchDto } from './dto/start-match.dto';
import { RegisterGoalDto } from './dto/register-goal.dto';
import { EndMatchDto } from './dto/end-match.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('sessions/:sessionId/matches')
  findBySession(@Req() req: any, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.matchesService.findBySession(sessionId, req.groupContext.groupId);
  }

  @Post('sessions/:sessionId/matches/start')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  start(
    @Req() req: any,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: StartMatchDto,
  ) {
    return this.matchesService.start(sessionId, dto, req.groupContext.groupId);
  }

  @Patch('matches/:id/goal')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  registerGoal(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterGoalDto,
  ) {
    return this.matchesService.registerGoal(id, dto, req.groupContext.groupId);
  }

  @Patch('matches/:id/end')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  end(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EndMatchDto,
  ) {
    return this.matchesService.end(id, dto, req.groupContext.groupId);
  }

  @Delete('matches/:id/goal/:goalId')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  undoGoal(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('goalId', ParseIntPipe) goalId: number,
  ) {
    return this.matchesService.undoGoal(id, goalId, req.groupContext.groupId);
  }

  @Get('sessions/:sessionId/matches/next')
  getNextMatch(@Req() req: any, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.matchesService.getNextMatch(sessionId, req.groupContext.groupId);
  }
}

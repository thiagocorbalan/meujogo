import { Controller, Get, Post, Param, Body, ParseIntPipe, Req, UseGuards } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { DrawTeamsDto } from './dto/draw-teams.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

@Controller('sessions/:sessionId')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('draw')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  draw(
    @Req() req: any,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() body: DrawTeamsDto,
  ) {
    return this.teamsService.draw(sessionId, req.groupContext.groupId, body.mode);
  }

  @Get('teams')
  findBySession(@Req() req: any, @Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.teamsService.findBySession(sessionId, req.groupContext.groupId);
  }
}

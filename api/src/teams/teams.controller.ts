import { Controller, Get, Post, Param, Body, ParseIntPipe } from '@nestjs/common';
import { TeamsService } from './teams.service.js';
import { DrawTeamsDto } from './dto/draw-teams.dto.js';

@Controller('sessions/:sessionId')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('draw')
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

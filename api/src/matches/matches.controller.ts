import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { StartMatchDto } from './dto/start-match.dto';
import { RegisterGoalDto } from './dto/register-goal.dto';
import { EndMatchDto } from './dto/end-match.dto';

@Controller()
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('sessions/:sessionId/matches')
  findBySession(@Param('sessionId', ParseIntPipe) sessionId: number) {
    return this.matchesService.findBySession(sessionId);
  }

  @Post('sessions/:sessionId/matches/start')
  start(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: StartMatchDto,
  ) {
    return this.matchesService.start(sessionId, dto);
  }

  @Patch('matches/:id/goal')
  registerGoal(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegisterGoalDto,
  ) {
    return this.matchesService.registerGoal(id, dto);
  }

  @Patch('matches/:id/end')
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

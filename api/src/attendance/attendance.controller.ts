import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

@Controller('sessions/:sessionId/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findBySession(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('search') search?: string,
  ) {
    return this.attendanceService.findBySession(sessionId, search);
  }

  @Patch(':playerId')
  update(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(sessionId, playerId, dto);
  }
}

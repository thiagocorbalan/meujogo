import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('sessions/:sessionId/attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
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
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  update(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(sessionId, playerId, dto);
  }
}

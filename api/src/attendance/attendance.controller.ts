import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

@Controller('sessions/:sessionId/attendance')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  findBySession(
    @Req() req: any,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Query('search') search?: string,
  ) {
    return this.attendanceService.findBySession(
      sessionId,
      req.groupContext.groupId,
      search,
    );
  }

  @Patch('me')
  updateMe(
    @Req() req: any,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: UpdateAttendanceDto,
  ) {
    const { groupId, userId } = req.groupContext;
    return this.attendanceService.updateOwnStatus(
      sessionId,
      userId,
      groupId,
      dto.status,
    );
  }

  @Patch(':playerId')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  update(
    @Req() req: any,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.attendanceService.update(
      sessionId,
      playerId,
      dto,
      req.groupContext.groupId,
    );
  }
}

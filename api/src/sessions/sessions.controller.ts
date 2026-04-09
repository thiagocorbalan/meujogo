import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

@Controller('sessions')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.sessionsService.findAll(req.groupContext.groupId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id, req.groupContext.groupId);
  }

  @Post()
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  create(@Req() req: any, @Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto, req.groupContext.groupId);
  }

  @Patch(':id/start')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  start(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.start(id, req.groupContext.groupId);
  }

  @Patch(':id/end')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  end(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.end(id, req.groupContext.groupId);
  }
}

import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '@prisma/client';

@Controller('sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll() {
    return this.sessionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto);
  }

  @Patch(':id/start')
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  start(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.start(id);
  }

  @Patch(':id/end')
  @Roles(UserRole.MODERADOR, UserRole.ADMIN)
  end(@Param('id', ParseIntPipe) id: number) {
    return this.sessionsService.end(id);
  }
}

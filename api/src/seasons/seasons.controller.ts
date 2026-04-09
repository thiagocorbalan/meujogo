import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SeasonsService } from './seasons.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

@Controller('seasons')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.seasonsService.findAll(req.groupContext.groupId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.seasonsService.findOne(id, req.groupContext.groupId);
  }

  @Post()
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  create(@Req() req: any, @Body() dto: CreateSeasonDto) {
    return this.seasonsService.create(dto, req.groupContext.groupId);
  }

  @Patch(':id/close')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  close(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.seasonsService.close(id, req.groupContext.groupId);
  }

  @Post('close-and-renew')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  closeAndRenew(@Req() req: any) {
    return this.seasonsService.closeAndCreateNew(req.groupContext.groupId);
  }
}

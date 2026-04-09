import { Controller, Get, Patch, Post, Body, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service.js';
import { UpdateSettingsDto } from './dto/update-settings.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

@Controller('settings')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@Req() req: any) {
    return this.settingsService.getSettings(req.groupContext.groupId);
  }

  @Patch()
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.updateSettings(dto, req.groupContext.groupId);
  }

  @Post('reset-data')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  resetData(@Req() req: any) {
    return this.settingsService.resetData(req.groupContext.groupId);
  }
}

import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard.js';
import { AdminGroupsService } from './admin-groups.service.js';
import { ListGroupsDto } from './dto/list-groups.dto.js';
import { SuspendGroupDto } from './dto/suspend-group.dto.js';

@Controller('admin/groups')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminGroupsController {
  constructor(private readonly adminGroupsService: AdminGroupsService) {}

  @Get()
  listGroups(@Query() query: ListGroupsDto) {
    return this.adminGroupsService.listGroups(query);
  }

  @Get(':id')
  getGroup(@Param('id', ParseIntPipe) id: number) {
    return this.adminGroupsService.getGroup(id);
  }

  @Post(':id/suspend')
  @HttpCode(200)
  suspendGroup(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendGroupDto,
    @Req() req: any,
  ) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.adminGroupsService.suspendGroup(
      id,
      dto.reason,
      req.user.id,
      ip,
    );
  }

  @Post(':id/reactivate')
  @HttpCode(200)
  reactivateGroup(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.adminGroupsService.reactivateGroup(id, req.user.id, ip);
  }
}

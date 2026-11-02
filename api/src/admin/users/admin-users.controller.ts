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
import { AdminUsersService } from './admin-users.service.js';
import { ListUsersDto } from './dto/list-users.dto.js';
import { SuspendUserDto } from './dto/suspend-user.dto.js';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, SuperAdminGuard)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  listUsers(@Query() query: ListUsersDto) {
    return this.adminUsersService.listUsers(query);
  }

  @Get(':id')
  getUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminUsersService.getUser(id);
  }

  @Post(':id/suspend')
  @HttpCode(200)
  suspendUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspendUserDto,
    @Req() req: any,
  ) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.adminUsersService.suspendUser(id, dto.reason, req.user.id, ip);
  }

  @Post(':id/unsuspend')
  @HttpCode(200)
  unsuspendUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const ip: string | undefined =
      req.ip ?? req.headers?.['x-forwarded-for'] ?? undefined;
    return this.adminUsersService.unsuspendUser(id, req.user.id, ip);
  }

  @Post(':id/impersonate')
  @HttpCode(200)
  impersonateUser(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.adminUsersService.impersonateUser(id, req.user.id);
  }
}

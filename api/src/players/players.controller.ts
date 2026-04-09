import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PlayersService } from './players.service';
import { CreatePlayerDto } from './dto/create-player.dto';
import { UpdatePlayerDto } from './dto/update-player.dto';
import { UpdatePlayerProfileDto } from './dto/update-player-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { GroupRole } from '@prisma/client';

@Controller('players')
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get('me')
  findMe(@Req() req: any) {
    const { groupId, userId } = req.groupContext;
    return this.playersService.findMe(userId, groupId);
  }

  @Patch('me/profile')
  updateMe(@Req() req: any, @Body() dto: UpdatePlayerProfileDto) {
    return this.playersService.updateMe(
      req.user.id,
      req.groupContext.groupId,
      dto,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.playersService.findAll(req.groupContext.groupId);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id, req.groupContext.groupId);
  }

  @Post()
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  create(@Req() req: any, @Body() dto: CreatePlayerDto) {
    return this.playersService.create(dto, req.groupContext.groupId);
  }

  @Patch(':id')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlayerDto,
  ) {
    return this.playersService.update(id, dto, req.groupContext.groupId);
  }

  @Delete(':id')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  remove(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.playersService.remove(id, req.groupContext.groupId);
  }
}

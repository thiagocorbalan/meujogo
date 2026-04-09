import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/create-group.dto.js';
import { UpdateGroupDto } from './dto/update-group.dto.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { CreateGuestPlayerDto } from './dto/create-guest-player.dto.js';

@Controller('groups')
export class GroupsController {
  constructor(
    private readonly groupsService: GroupsService,
    private readonly prisma: PrismaService,
  ) {}

  // -------------------------------------------------------------------------
  // Public endpoints (no auth)
  // -------------------------------------------------------------------------

  @Get('invite/:code')
  getInviteInfo(@Param('code') code: string) {
    return this.groupsService.getInviteInfo(code);
  }

  // -------------------------------------------------------------------------
  // Auth-only endpoints (no group context needed)
  // -------------------------------------------------------------------------

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.createGroup(req.user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any) {
    return this.groupsService.findAllByUser(req.user.id);
  }

  @Post('invite/:code/join')
  @UseGuards(JwtAuthGuard)
  joinViaInvite(
    @Req() req: any,
    @Param('code') code: string,
    @Body() body: { linkPlayerId?: number } = {},
  ) {
    return this.groupsService.joinViaInvite(
      code,
      req.user.id,
      body.linkPlayerId,
    );
  }

  // -------------------------------------------------------------------------
  // Group-scoped endpoints (auth + group context + role guard)
  // -------------------------------------------------------------------------

  @Get(':id')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  findOne(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(req.groupContext.groupId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  update(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.groupsService.update(req.groupContext.groupId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO)
  softDelete(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.groupsService.softDelete(req.groupContext.groupId);
  }

  @Post(':id/invite/regenerate')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  regenerateInviteCode(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.groupsService.regenerateInviteCode(req.groupContext.groupId);
  }

  @Get(':id/members')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  async listMembers(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    const groupId = req.groupContext.groupId;

    // Get registered members (with user accounts)
    const members = await this.prisma.groupMember.findMany({
      where: { groupId, isActive: true },
      include: {
        player: true,
        user: { select: { email: true, name: true } },
      },
    });

    // Get guest players (CONVIDADO type, no userId, not already linked to a member)
    const memberPlayerIds = members
      .map((m: any) => m.playerId)
      .filter((id: any) => id != null);

    const guestPlayers = await this.prisma.player.findMany({
      where: {
        groupId,
        type: 'CONVIDADO',
        isActive: true,
        userId: null,
        id: { notIn: memberPlayerIds.length > 0 ? memberPlayerIds : [0] },
      },
    });

    // Map guest players to a member-like structure for the frontend
    const guestMembers = guestPlayers.map((player: any) => ({
      id: `guest-${player.id}`,
      groupId,
      userId: null,
      playerId: player.id,
      role: 'JOGADOR',
      isActive: true,
      createdAt: player.createdAt,
      updatedAt: player.updatedAt,
      player,
      user: null,
    }));

    return [...members, ...guestMembers];
  }

  @Post(':id/members')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  addMember(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupsService.addMember(
      req.groupContext.groupId,
      dto.userId,
      dto.role ?? 'JOGADOR',
    );
  }

  @Patch(':id/members/:memberId')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO)
  updateMemberRole(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
    @Body('role') role: string,
  ) {
    return this.groupsService.updateMemberRole(
      req.groupContext.groupId,
      memberId,
      role,
    );
  }

  @Patch(':id/members/:memberId/suspend')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  suspendMember(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.groupsService.suspendMember(
      req.groupContext.groupId,
      memberId,
    );
  }

  @Patch(':id/members/:memberId/reactivate')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  reactivateMember(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.groupsService.reactivateMember(
      req.groupContext.groupId,
      memberId,
    );
  }

  @Delete(':id/members/:memberId')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  removeMember(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('memberId', ParseIntPipe) memberId: number,
  ) {
    return this.groupsService.removeMember(req.groupContext.groupId, memberId);
  }

  @Post(':id/members/leave')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  leaveGroup(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.groupsService.leaveGroup(
      req.groupContext.groupId,
      req.user.id,
    );
  }

  @Post(':id/guest-player')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  addGuestPlayer(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateGuestPlayerDto,
  ) {
    return this.groupsService.addGuestPlayer(req.groupContext.groupId, dto);
  }

  @Post(':id/guest-player/:playerId/link-user')
  @UseGuards(JwtAuthGuard, GroupRolesGuard)
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  linkUserToPlayer(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Param('playerId', ParseIntPipe) playerId: number,
    @Body('userId') userId: number,
  ) {
    return this.groupsService.linkUserToPlayer(playerId, userId);
  }
}

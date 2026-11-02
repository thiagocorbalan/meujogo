import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupRole } from '@prisma/client';
import { SubstitutionsService } from './substitutions.service.js';
import { CreateSubstitutionDto } from './dto/create-substitution.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../common/guards/group-roles.guard.js';
import { GroupRoles } from '../common/decorators/group-roles.decorator.js';

interface AuthedRequest {
  groupContext: { groupId: number };
}

@Controller()
@UseGuards(JwtAuthGuard, GroupRolesGuard)
export class SubstitutionsController {
  constructor(private readonly substitutionsService: SubstitutionsService) {}

  @Post('sessions/:sessionId/substitutions')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  create(
    @Req() req: AuthedRequest,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: CreateSubstitutionDto,
  ) {
    return this.substitutionsService.create(
      sessionId,
      dto,
      req.groupContext.groupId,
    );
  }

  @Get('sessions/:sessionId/substitutions')
  findBySession(
    @Req() req: AuthedRequest,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.substitutionsService.findBySession(
      sessionId,
      req.groupContext.groupId,
    );
  }

  @Get('sessions/:sessionId/substitutions/pool')
  getAvailablePool(
    @Req() req: AuthedRequest,
    @Param('sessionId', ParseIntPipe) sessionId: number,
  ) {
    return this.substitutionsService.getAvailablePool(
      sessionId,
      req.groupContext.groupId,
    );
  }

  @Delete('sessions/:sessionId/substitutions/:id')
  @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
  undo(
    @Req() req: AuthedRequest,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.substitutionsService.undo(
      sessionId,
      id,
      req.groupContext.groupId,
    );
  }
}

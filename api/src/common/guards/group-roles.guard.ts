import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupRole } from '@prisma/client';
import { GROUP_ROLES_KEY } from '../decorators/group-roles.decorator.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class GroupRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<GroupRole[]>(
      GROUP_ROLES_KEY,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const { groupContext } = request;

    // If groupContext exists but is incomplete (middleware ran before JWT guard),
    // complete the membership validation now that req.user is available
    if (groupContext?.groupId && !groupContext.groupRole && request.user?.id) {
      const membership = await this.prisma.groupMember.findFirst({
        where: {
          groupId: groupContext.groupId,
          userId: request.user.id,
          isActive: true,
        },
        include: { group: true },
      });

      if (!membership) {
        throw new ForbiddenException('Voce nao e membro deste grupo');
      }
      if (!membership.group.isActive) {
        throw new NotFoundException('Grupo nao encontrado');
      }

      request.groupContext = {
        groupId: membership.groupId,
        groupRole: membership.role,
        userId: request.user.id,
        playerId: membership.playerId,
        isSuspended: membership.group.isSuspended,
      };
    }

    // No role restriction on this endpoint
    if (!requiredRoles) {
      // Superadmin bypass: superadmin can access suspended groups
      if (request.user?.isSuperAdmin === true) {
        return true;
      }
      if (request.groupContext?.isSuspended === true) {
        throw new ForbiddenException('Grupo suspenso');
      }
      return true;
    }

    // Superadmin bypass: superadmin can access any group endpoint
    if (request.user?.isSuperAdmin === true) {
      return true;
    }

    // Reject access to suspended groups (non-superadmin)
    if (request.groupContext?.isSuspended === true) {
      throw new ForbiddenException('Grupo suspenso');
    }

    if (!request.groupContext?.groupRole) {
      throw new ForbiddenException(
        'Group context is required for this endpoint',
      );
    }

    if (requiredRoles.includes(request.groupContext.groupRole)) {
      return true;
    }

    throw new ForbiddenException('Insufficient group role for this operation');
  }
}

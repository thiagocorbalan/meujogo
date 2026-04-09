import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GroupContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const headerValue = req.header('X-Group-Id');

    if (headerValue === undefined || headerValue === null) {
      return next();
    }

    const parsed = Number(headerValue);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('X-Group-Id invalido');
    }

    const groupId = parsed;
    const userId = (req as any).user?.id;

    // Middleware runs before guards, so req.user may not exist yet.
    // Store the groupId for later validation by the guard, or validate if user exists.
    if (!userId) {
      (req as any)['groupContext'] = { groupId, groupRole: null, userId: null, playerId: null };
      return next();
    }

    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
        isActive: true,
      },
      include: {
        group: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Voce nao e membro deste grupo');
    }

    if (!membership.group.isActive) {
      throw new NotFoundException('Grupo nao encontrado');
    }

    (req as any)['groupContext'] = {
      groupId: membership.groupId,
      groupRole: membership.role,
      userId,
      playerId: membership.playerId,
    };

    next();
  }
}

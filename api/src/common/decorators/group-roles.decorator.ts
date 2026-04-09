import { SetMetadata } from '@nestjs/common';
import { GroupRole } from '@prisma/client';

export const GROUP_ROLES_KEY = 'groupRoles';
export const GroupRoles = (...roles: GroupRole[]) =>
  SetMetadata(GROUP_ROLES_KEY, roles);

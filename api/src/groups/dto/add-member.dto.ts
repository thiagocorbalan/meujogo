import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { GroupRole } from '@prisma/client';

export class AddMemberDto {
  @IsInt()
  userId: number;

  @IsOptional()
  @IsEnum(GroupRole)
  role?: GroupRole;
}

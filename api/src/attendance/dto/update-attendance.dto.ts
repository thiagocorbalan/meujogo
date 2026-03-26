import { IsEnum } from 'class-validator';
import { PlayerStatus } from '@prisma/client';

export class UpdateAttendanceDto {
  @IsEnum(PlayerStatus)
  status: PlayerStatus;
}

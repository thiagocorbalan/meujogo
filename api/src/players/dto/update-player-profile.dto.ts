import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PlayerPosition, PlayerStatus } from '@prisma/client';

export class UpdatePlayerProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(PlayerPosition)
  @IsOptional()
  position?: PlayerPosition;

  @IsEnum(PlayerStatus)
  @IsOptional()
  status?: PlayerStatus;
}

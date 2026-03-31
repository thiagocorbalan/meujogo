import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PlayerPosition, PlayerStatus, PlayerType } from '@prisma/client';

export class UpdatePlayerDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsEnum(PlayerPosition)
  @IsOptional()
  position?: PlayerPosition;

  @IsEnum(PlayerType)
  @IsOptional()
  type?: PlayerType;

  @IsEnum(PlayerStatus)
  @IsOptional()
  status?: PlayerStatus;
}

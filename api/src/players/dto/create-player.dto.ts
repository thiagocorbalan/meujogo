import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlayerPosition, PlayerType } from '@prisma/client';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @IsEnum(PlayerType)
  type: PlayerType;
}

import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { PlayerPosition, PlayerType } from '@prisma/client';

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @IsEnum(PlayerType)
  type: PlayerType;
}

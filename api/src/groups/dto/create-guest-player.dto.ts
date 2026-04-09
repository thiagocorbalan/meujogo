import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PlayerPosition } from '@prisma/client';

export class CreateGuestPlayerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;
}

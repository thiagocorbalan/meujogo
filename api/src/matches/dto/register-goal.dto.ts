import { IsInt, IsOptional } from 'class-validator';

export class RegisterGoalDto {
  @IsInt()
  playerId: number;

  @IsInt()
  teamId: number;

  @IsOptional()
  @IsInt()
  minute?: number;
}

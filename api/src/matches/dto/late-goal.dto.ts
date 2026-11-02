import { IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class LateGoalDto {
  @IsInt()
  teamId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

import { IsInt, Min } from 'class-validator';

export class CreateSessionDto {
  @IsInt()
  seasonId: number;

  @IsInt()
  @Min(1)
  durationMinutes: number;

  @IsInt()
  @Min(1)
  matchDurationMinutes: number;
}

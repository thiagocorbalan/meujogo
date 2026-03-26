import { IsInt } from 'class-validator';

export class StartMatchDto {
  @IsInt()
  teamAId: number;

  @IsInt()
  teamBId: number;
}

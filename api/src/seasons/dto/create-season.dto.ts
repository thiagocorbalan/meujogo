import { IsDateString, IsInt } from 'class-validator';

export class CreateSeasonDto {
  @IsInt()
  year: number;

  @IsDateString()
  startDate: string;
}

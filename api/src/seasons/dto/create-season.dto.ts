import { IsDateString, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSeasonDto {
  @IsInt()
  year: number;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

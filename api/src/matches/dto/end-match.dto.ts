import { IsInt, IsOptional } from 'class-validator';

export class EndMatchDto {
  @IsOptional()
  @IsInt()
  winnerId?: number;
}

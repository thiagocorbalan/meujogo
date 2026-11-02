import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { SubstitutionType, SubstitutionReason } from '@prisma/client';

export class CreateSubstitutionDto {
  @IsEnum(SubstitutionType)
  type!: SubstitutionType;

  @IsEnum(SubstitutionReason)
  reason!: SubstitutionReason;

  @IsInt()
  teamId!: number;

  @IsInt()
  playerOutId!: number;

  @IsInt()
  playerInId!: number;

  @IsOptional()
  @IsInt()
  matchId?: number | null;

  @IsOptional()
  @IsInt()
  minute?: number | null;
}

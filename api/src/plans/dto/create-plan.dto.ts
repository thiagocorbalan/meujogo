import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TrialExpireBehavior } from '@prisma/client';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceMonthly: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  priceAnnual: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxSessionsPerMonth?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @IsOptional()
  @IsString()
  stripePriceIdAnnual?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  trialDays?: number;

  @IsOptional()
  @IsEnum(TrialExpireBehavior)
  trialExpireBehavior?: TrialExpireBehavior;
}

import {
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DrawMode {
  ALEATORIO = 'ALEATORIO',
  EQUILIBRADO = 'EQUILIBRADO',
}

export class VestDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @MaxLength(50)
  color: string;
}

export class UpdateSettingsDto {
  @IsOptional()
  @IsInt()
  maxTeams?: number;

  @IsOptional()
  @IsInt()
  playersPerTeam?: number;

  @IsOptional()
  @IsInt()
  sessionDurationMin?: number;

  @IsOptional()
  @IsInt()
  matchDurationMin?: number;

  @IsOptional()
  @IsEnum(DrawMode)
  drawMode?: DrawMode;

  @IsOptional()
  @IsNumber()
  defaultElo?: number;

  @IsOptional()
  @IsNumber()
  kFactor?: number;

  @IsOptional()
  @IsInt()
  maxConsecutiveGames?: number;

  @IsOptional()
  @IsBoolean()
  teamSwapEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamSwapTimeMin?: number;

  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  paymentInfo?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VestDto)
  vests?: VestDto[];
}

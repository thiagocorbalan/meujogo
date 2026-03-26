import {
  IsOptional,
  IsInt,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DrawMode {
  ALEATORIO = 'ALEATORIO',
  EQUILIBRADO = 'EQUILIBRADO',
}

export class VestDto {
  @IsString()
  name: string;

  @IsString()
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VestDto)
  vests?: VestDto[];
}

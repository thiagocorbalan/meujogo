import { IsOptional, IsEnum } from 'class-validator';

export enum DrawMode {
  ALEATORIO = 'ALEATORIO',
  EQUILIBRADO = 'EQUILIBRADO',
}

export class DrawTeamsDto {
  @IsOptional()
  @IsEnum(DrawMode)
  mode?: string;
}

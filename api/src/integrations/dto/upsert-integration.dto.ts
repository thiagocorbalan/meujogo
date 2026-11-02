import { IsNotEmpty, IsString } from 'class-validator';

export class UpsertIntegrationDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}

import { IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  rules?: string;

  @IsOptional()
  @IsString()
  paymentInfo?: string;
}

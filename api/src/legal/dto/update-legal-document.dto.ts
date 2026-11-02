import { IsOptional, IsString } from 'class-validator';

export class UpdateLegalDocumentDto {
  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

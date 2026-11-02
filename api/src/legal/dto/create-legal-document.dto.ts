import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLegalDocumentDto {
  @IsString()
  @IsNotEmpty()
  version: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

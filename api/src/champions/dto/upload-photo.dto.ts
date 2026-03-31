import { IsNotEmpty, IsString, IsUrl, MaxLength } from 'class-validator';

export class UploadPhotoDto {
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  @MaxLength(2048)
  photoUrl: string;
}

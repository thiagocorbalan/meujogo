import { IsNotEmpty, IsString } from 'class-validator';

export class SuspendGroupDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
}

import { IsNumber, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  priceId: string;

  @IsNumber()
  groupId: number;
}

import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class QuoteItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Min(1)
  unitPrice: number;

  @IsNumber()
  @Min(1)
  quantity: number;
}

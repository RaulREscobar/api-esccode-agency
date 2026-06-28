import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWorkTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  basePrice: number;

  @IsBoolean()
  @IsOptional()
  allowsExtras?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

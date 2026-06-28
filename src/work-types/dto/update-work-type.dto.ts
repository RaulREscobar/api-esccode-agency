import { IsBoolean, IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateWorkTypeDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;

  @IsOptional()
  @IsBoolean()
  allowsExtras?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

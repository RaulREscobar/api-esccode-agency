import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateProjectResourceFieldDto {
  @IsOptional()
  @IsBoolean()
  isSensitive?: boolean;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  value?: string;

  @IsOptional()
  displayOrder?: number;
}

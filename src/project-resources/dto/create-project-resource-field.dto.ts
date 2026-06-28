import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateProjectResourceFieldDto {
  @IsOptional()
  @IsUUID()
  fieldDefinitionId?: string;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsBoolean()
  isSensitive: boolean;

  @IsNotEmpty()
  @IsString()
  value: string;

  @IsOptional()
  @IsNotEmpty()
  displayOrder?: number;
}

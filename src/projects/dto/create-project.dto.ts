import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProjectStatus, QuoteStatus, PriorityLevel } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @IsString()
  @IsNotEmpty()
  workTypeId: string;

  @IsString()
  @IsNotEmpty()
  clientDisplayName: string;

  @IsOptional()
  @IsEnum(QuoteStatus)
  quoteStatus?: QuoteStatus;

  @IsOptional()
  @IsEnum(PriorityLevel)
  priority?: PriorityLevel;

  @IsOptional()
  @IsString()
  comments?: string;
}

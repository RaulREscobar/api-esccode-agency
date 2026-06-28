import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProjectStatus, QuoteStatus, PriorityLevel } from '@prisma/client';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;

  @IsOptional()
  @IsString()
  workTypeId?: string;

  @IsOptional()
  @IsString()
  clientDisplayName?: string;

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

import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PriorityLevel, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @IsEnum(PriorityLevel)
  @IsOptional()
  priority?: PriorityLevel;
}

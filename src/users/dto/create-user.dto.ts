import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, IsArray, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  assignedProjectIds?: string[];
}

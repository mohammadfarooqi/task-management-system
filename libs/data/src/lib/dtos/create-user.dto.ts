import { IsEmail, IsString, MinLength, MaxLength, IsInt, IsOptional, IsEnum } from 'class-validator';
import { RoleType } from '../role-types';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @IsInt()
  organizationId!: number;

  @IsOptional()
  @IsEnum(RoleType)
  roleType?: RoleType;
}
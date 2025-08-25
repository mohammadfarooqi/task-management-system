import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  role: string; // Single role instead of roles array
}
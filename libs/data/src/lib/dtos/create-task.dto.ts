import { IsString, IsOptional, IsEnum, IsDateString, MinLength, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsEnum(['pending', 'in-progress', 'completed'])
  status?: string;

  @IsOptional()
  @IsEnum(['low', 'medium', 'high'])
  priority?: string;

  @IsOptional()
  @IsEnum(['work', 'personal', 'other'])
  category?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: Date;
}
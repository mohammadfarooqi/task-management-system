import { Controller, Post, Body, HttpCode, HttpStatus, Get } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { Public, CurrentUser } from '@task-management-system/auth';
import {
  LoginDto,
  ApiResponse,
  LoginResponseDto
} from '@task-management-system/data';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse<LoginResponseDto>> {
    try {
      const result = await this.authService.login(loginDto);

      return {
        success: true,
        data: result,
        message: 'Login successful',
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }

    @Get('profile')
    async getProfile(@CurrentUser() user: any): Promise<ApiResponse<any>> {
      return {
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      };
    }
}
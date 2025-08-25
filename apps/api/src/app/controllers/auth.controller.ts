import { Controller, Post, Body, HttpCode, HttpStatus, Get, Res } from '@nestjs/common';
import { Response } from 'express';
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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response
  ): Promise<ApiResponse<LoginResponseDto>> {
    const result = await this.authService.login(loginDto);

    // Set HttpOnly cookie with the token
    response.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Return the full response but without the token
    // The frontend expects user and role in the response
    return {
      success: true,
      data: {
        user: result.user,
        role: result.role,
        // accessToken is intentionally omitted since it's in the cookie
      } as any as LoginResponseDto,
      message: 'Login successful',
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) response: Response): Promise<ApiResponse<void>> {
    // Clear the HttpOnly cookie
    response.clearCookie('accessToken');

    return {
      success: true,
      data: undefined,
      message: 'Logout successful',
    };
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
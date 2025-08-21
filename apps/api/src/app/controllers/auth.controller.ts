import { Controller, Post, Body, HttpCode, HttpStatus, Get, Request } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import type { CreateUserDto, LoginDto } from '../services/auth.service';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);

    // Remove password hash before returning
    const { passwordHash, ...userResponse } = user;

    return {
      success: true,
      data: userResponse,
      message: 'User registered successfully',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);

    return {
      success: true,
      data: result,
      message: 'Login successful',
    };
  }

    @Get('profile')
    async getProfile(@Request() req: any) {
      return {
        success: true,
        data: {
          user: req.user,
          message: 'This is a protected route!',
        },
      };
    }
}
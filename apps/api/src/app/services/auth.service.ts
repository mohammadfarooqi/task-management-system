import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';

// We'll use our shared interfaces later, for now let's define locally
export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(createUserDto.password, saltRounds);

    // Create user
    const userData = {
      email: createUserDto.email,
      passwordHash,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      organizationId: createUserDto.organizationId,
    };

    return this.userService.create(userData);
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    // Find user
    const user = await this.userService.findByEmail(loginDto.email);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
    };
    const accessToken = this.jwtService.sign(payload);

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userService.findById(userId);
  }
}
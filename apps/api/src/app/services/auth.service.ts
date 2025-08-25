import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/user-role.entity';
import { LoginDto, LoginResponseDto, JwtPayload } from '@task-management-system/data';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}


  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
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

    // Get user's role (one role per user)
    const userRole = await this.userRoleRepository.findOne({
      where: { userId: user.id },
      relations: ['role'],
    });

    const role = userRole?.role?.name || 'Viewer';

    // Generate JWT token
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: user.organizationId,
      role: role as any, // Will be string at runtime but typed as RoleType
    };
    const accessToken = this.jwtService.sign(payload);

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      role, // Single role instead of array
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userService.findById(userId);
  }
}
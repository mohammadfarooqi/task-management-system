import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from './user.service';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleType } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { CreateUserDto, LoginDto, LoginResponseDto } from '@task-management-system/data';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
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

    const user = await this.userService.create(userData);

    // Assign default VIEWER role to new user
    const viewerRole = await this.roleRepository.findOne({
      where: { name: RoleType.VIEWER }
    });

    if (viewerRole) {
      await this.userRoleRepository.save({
        userId: user.id,
        roleId: viewerRole.id,
        organizationId: user.organizationId,
      });
    }

    return user;
  }

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

    // Get user's roles
    const userRoles = await this.userRoleRepository.find({
      where: { userId: user.id },
      relations: ['role'],
    });

    const roles = userRoles.map(ur => ur.role?.name).filter(Boolean) as string[];

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      organizationId: user.organizationId,
      roles,
    };
    const accessToken = this.jwtService.sign(payload);

    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      roles,
    };
  }

  async validateUser(userId: number): Promise<User | null> {
    return this.userService.findById(userId);
  }
}
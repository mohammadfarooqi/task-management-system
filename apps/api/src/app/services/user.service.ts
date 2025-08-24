import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { RoleType } from '@task-management-system/data';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async createUserWithRole(
    userData: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      organizationId: number;
    },
    roleType: RoleType
  ): Promise<Omit<User, 'passwordHash'>> {
    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = Number(process.env.BCRYPT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);

    // Create user
    const user = await this.userRepository.save({
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      organizationId: userData.organizationId,
      isActive: true,
    });

    // Get the role
    const role = await this.roleRepository.findOne({
      where: { name: roleType }
    });

    if (!role) {
      throw new InternalServerErrorException(`Role ${roleType} not found in system`);
    }

    // Assign role to user
    await this.userRoleRepository.save({
      userId: user.id,
      roleId: role.id,
    });

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
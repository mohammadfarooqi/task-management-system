import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Organization } from '../entities/organization.entity';
import { Role, RoleType } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { UserRole } from '../entities/user-role.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
  ) {}

  async onModuleInit() {
    await this.seedData();
  }

  private async seedData() {
    // Check if data already exists
    const roleCount = await this.roleRepository.count();
    if (roleCount > 0) {
      return; // Data already seeded
    }

    console.log('Seeding initial data...');

    // Create organizations (2-level hierarchy)
    const parentOrg = await this.organizationRepository.save({
      name: 'TechCorp Holdings',
    });

    const childOrg = await this.organizationRepository.save({
      name: 'TechCorp Development',
      parentId: parentOrg.id,
    });

    // Create roles
    const [ownerRole, adminRole, viewerRole] = await this.roleRepository.save([
      {
        name: RoleType.OWNER,
        description: 'Full access to everything',
        level: 1,
      },
      {
        name: RoleType.ADMIN,
        description: 'Administrative access',
        level: 2,
      },
      {
        name: RoleType.VIEWER,
        description: 'Read-only access',
        level: 3,
      },
    ]);

    // Create test users with different roles for testing
    const testUsers = await this.userRepository.count();
    if (testUsers <= 1) {  // Only create if we don't have many users

      // Create Admin user
      const adminUser = await this.userRepository.save({
        email: 'admin@techcorp.com',
        passwordHash: await bcrypt.hash('password123', 12),
        firstName: 'Admin',
        lastName: 'User',
        organizationId: parentOrg.id,
      });

      // Create Owner user
      const ownerUser = await this.userRepository.save({
        email: 'owner@techcorp.com',
        passwordHash: await bcrypt.hash('password123', 12),
        firstName: 'Owner',
        lastName: 'User',
        organizationId: parentOrg.id,
      });

      // Assign roles
      await this.userRoleRepository.save([
        { userId: ownerUser.id, roleId: ownerRole.id, organizationId: parentOrg.id },
        { userId: adminUser.id, roleId: adminRole.id, organizationId: parentOrg.id },
      ]);

      console.log('Test users created:');
      console.log('   Owner: owner@techcorp.com / password123');
      console.log('   Admin: admin@techcorp.com / password123');
    }

    console.log('Initial data seeded successfully!');
    console.log(`Organizations: ${parentOrg.name} (ID: ${parentOrg.id}), ${childOrg.name} (ID: ${childOrg.id})`);
    console.log('Roles: Owner, Admin, Viewer');
  }
}
import { Controller, Post, Body, Param, ParseIntPipe, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { Roles, RolesGuard } from '@task-management-system/auth';
import { RoleType } from '@task-management-system/data';
import { OrganizationService } from '../services/organization.service';
import { UserService } from '../services/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';

interface CreateOrganizationDto {
  name: string;
  parentId?: number;
}

interface CreateOwnerDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

@Controller('organizations')
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
  ) {}

  @Post()
  @Roles(RoleType.SYSTEM_ADMIN)
  @UseGuards(RolesGuard)
  async createOrganization(@Body() createOrgDto: CreateOrganizationDto, @Request() req: any) {
    // Check if parent organization exists if parentId is provided
    if (createOrgDto.parentId) {
      const parentOrg = await this.organizationRepository.findOne({
        where: { id: createOrgDto.parentId }
      });
      
      if (!parentOrg) {
        throw new HttpException('Parent organization not found', HttpStatus.NOT_FOUND);
      }
      
      // Check if parent already has a parent (prevent 3-level hierarchy)
      if (parentOrg.parentId) {
        throw new HttpException('Cannot create organization under a child organization', HttpStatus.BAD_REQUEST);
      }
    }

    const organization = await this.organizationRepository.save({
      name: createOrgDto.name,
      parentId: createOrgDto.parentId,
    });

    return {
      success: true,
      data: organization,
      message: 'Organization created successfully',
    };
  }

  @Post(':id/owner')
  @Roles(RoleType.SYSTEM_ADMIN)
  @UseGuards(RolesGuard)
  async createOwnerForOrganization(
    @Param('id', ParseIntPipe) organizationId: number,
    @Body() createOwnerDto: CreateOwnerDto,
    @Request() req: any
  ) {
    // Check if organization exists
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId }
    });
    
    if (!organization) {
      throw new HttpException('Organization not found', HttpStatus.NOT_FOUND);
    }

    // Create user with Owner role using UserService
    const userWithoutPassword = await this.userService.createUserWithRole(
      {
        email: createOwnerDto.email,
        password: createOwnerDto.password,
        firstName: createOwnerDto.firstName,
        lastName: createOwnerDto.lastName,
        organizationId,
      },
      RoleType.OWNER
    );

    return {
      success: true,
      data: {
        ...userWithoutPassword,
        role: RoleType.OWNER,
        organization: organization.name,
      },
      message: 'Owner created successfully for organization',
    };
  }
}
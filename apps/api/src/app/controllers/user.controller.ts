import { Controller, Post, Body, Request, ForbiddenException, UseGuards } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { OrganizationService } from '../services/organization.service';
import { CreateUserDto, ApiResponse, RoleType } from '@task-management-system/data';
import { Roles, RolesGuard } from '@task-management-system/auth';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
    private organizationService: OrganizationService,
  ) {}

  @Post()
  @Roles(RoleType.SYSTEM_ADMIN, RoleType.OWNER, RoleType.ADMIN)
  @UseGuards(RolesGuard)
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Request() req: any
  ): Promise<ApiResponse<any>> {
    try {
      const requesterRole = req.user.role;
      const requesterOrgId = req.user.organizationId;
      const targetOrgId = createUserDto.organizationId;
      const targetRole = createUserDto.roleType || RoleType.VIEWER;

      // Viewer check is now handled by @Roles decorator, but keep as defense in depth
      if (requesterRole === RoleType.VIEWER) {
        return {
          success: false,
          message: 'Viewers cannot create users',
        };
      }

      // Check if trying to create in same org
      const isSameOrg = requesterOrgId === targetOrgId;

      // Check if trying to create in child org
      const isChildOrg = await this.organizationService.isChildOrganization(
        requesterOrgId,
        targetOrgId
      );

      // Permission checks based on requester role
      if (requesterRole === RoleType.OWNER) {
        // Owner can create any role in their own org
        if (isSameOrg) {
          // All roles allowed
        }
        // Owner can create Admin/Viewer in child orgs (not Owner)
        else if (isChildOrg) {
          if (targetRole === RoleType.OWNER) {
            throw new ForbiddenException('Cannot create Owner in child organization');
          }
        } else {
          throw new ForbiddenException('Cannot create users in unrelated organizations');
        }
      } else if (requesterRole === RoleType.ADMIN) {
        // Admin cannot create Owners anywhere
        if (targetRole === RoleType.OWNER) {
          throw new ForbiddenException('Admins cannot create Owner users');
        }

        // Admin can create Admin/Viewer in their own org or child orgs
        if (!isSameOrg && !isChildOrg) {
          throw new ForbiddenException('Cannot create users in unrelated organizations');
        }
      }

      // If all checks pass, create the user
      const userResponse = await this.userService.createUserWithRole(
        {
          email: createUserDto.email,
          password: createUserDto.password,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          organizationId: createUserDto.organizationId,
        },
        targetRole
      );

      return {
        success: true,
        data: userResponse,
        message: 'User created successfully',
      };
    } catch (error: any) {
      return {
        success: false,
        data: null,
        message: error.message,
      };
    }
  }
}
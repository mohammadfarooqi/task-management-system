import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuditService } from '../services/audit.service';
import { Roles, RolesGuard } from '@task-management-system/auth';
import { RoleType, AuditLogFiltersDto } from '@task-management-system/data';

@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(RoleType.SYSTEM_ADMIN, RoleType.OWNER, RoleType.ADMIN)
  @UseGuards(RolesGuard)
  async getAuditLogs(@Query() query: AuditLogFiltersDto, @Request() req: any) {
    // Role check is now handled by @Roles decorator and RolesGuard
    const result = await this.auditService.getAuditLogs(req.user.organizationId, query);

    return {
      success: true,
      data: result,
    };
  }
}
import { Controller, Get, Query, Request } from '@nestjs/common';
import { AuditService } from '../services/audit.service';

interface AuditLogQueryDto {
  userId?: number;
  action?: string;
  resourceType?: string;
  page?: number;
  limit?: number;
}

@Controller('audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  async getAuditLogs(@Query() query: AuditLogQueryDto, @Request() req: any) {
    // only Owner and Admin can access audit logs
    const userRoles = req.user.roles || [];
    if (!userRoles.includes('Owner') && !userRoles.includes('Admin')) {
      return {
        success: false,
        message: 'Access denied. Only Owners and Admins can view audit logs.',
        statusCode: 403
      };
    }

    const result = await this.auditService.getAuditLogs(req.user.organizationId, query);

    return {
      success: true,
      data: result,
    };
  }
}
export interface AuditLogData {
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  organizationId: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLog extends AuditLogData {
  id: number;
  createdAt: Date | string;
}
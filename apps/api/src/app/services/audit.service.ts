import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities/audit-log.entity';

interface AuditLogData {
  userId: number;
  action: string;
  resourceType: string;
  resourceId?: number;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  organizationId: number;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(data: AuditLogData): Promise<AuditLog> {
    console.log(`AUDIT: ${data.action} by user ${data.userId} on ${data.resourceType} ${data.resourceId || ''}`);

    const auditLog = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(auditLog);
  }

  async getAuditLogs(
    organizationId: number,
    options: {
      userId?: number;
      action?: string;
      resourceType?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    const { page = 1, limit = 50, ...filters } = options;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .where('audit.organizationId = :organizationId', { organizationId });

    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.action) {
      queryBuilder.andWhere('audit.action LIKE :action', { action: `%${filters.action}%` });
    }

    if (filters.resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', { resourceType: filters.resourceType });
    }

    queryBuilder
      .orderBy('audit.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [logs, total] = await queryBuilder.getManyAndCount();

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
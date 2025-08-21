import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ length: 100 })
  action!: string; // 'task:created', 'task:updated', etc.

  @Column({ name: 'resource_type', length: 50 })
  resourceType!: string; // 'task', 'user', etc.

  @Column({ name: 'resource_id', nullable: true })
  resourceId?: number;

  @Column({ type: 'json', nullable: true })
  details?: any; // Additional context

  @Column({ name: 'ip_address', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ name: 'organization_id' })
  organizationId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
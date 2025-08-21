import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';
import { Organization } from './organization.entity';

@Entity('user_roles')
@Unique(['userId', 'roleId', 'organizationId'])
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'role_id' })
  roleId!: number;

  @Column({ name: 'organization_id' })
  organizationId!: number;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy?: number;

  @ManyToOne(() => User, user => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Role, role => role)
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @ManyToOne(() => Organization, org => org)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;
}
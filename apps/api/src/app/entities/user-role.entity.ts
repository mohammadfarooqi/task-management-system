import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Role } from './role.entity';

@Entity('user_roles')
@Unique(['userId']) // One role per user
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', unique: true }) // Enforce 1:1 relationship
  userId!: number;

  @Column({ name: 'role_id' })
  roleId!: number;

  @Column({ name: 'assigned_by', nullable: true })
  assignedBy?: number;

  @ManyToOne(() => User, user => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => Role, role => role)
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @CreateDateColumn({ name: 'assigned_at' })
  assignedAt!: Date;
}
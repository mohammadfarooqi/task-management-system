import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { TaskStatus, TaskPriority, TaskCategory } from '@task-management-system/data';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20, default: TaskStatus.PENDING })
  status!: TaskStatus;

  @Column({ type: 'varchar', length: 20, default: TaskPriority.MEDIUM })
  priority!: TaskPriority;

  @Column({ type: 'varchar', length: 20, default: TaskCategory.WORK })
  category!: TaskCategory;

  @Column({ name: 'due_date', type: 'datetime', nullable: true })
  dueDate?: Date;

  @Column({ name: 'created_by' })
  createdBy!: number;

  @Column({ name: 'organization_id' })
  organizationId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator?: User;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
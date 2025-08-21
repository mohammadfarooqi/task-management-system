import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum RoleType {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer'
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  name!: RoleType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'integer' })
  level!: number; // 1=Owner, 2=Admin, 3=Viewer (for hierarchy)

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
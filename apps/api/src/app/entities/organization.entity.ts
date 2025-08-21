import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  name!: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: number;

  @ManyToOne(() => Organization, org => org.children)
  @JoinColumn({ name: 'parent_id' })
  parent?: Organization;

  @OneToMany(() => Organization, org => org.parent)
  children?: Organization[];

  @OneToMany(() => User, user => user.organization)
  users?: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
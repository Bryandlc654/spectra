import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { Area } from '../areas/area.entity';

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN_TENANT = 'admin_tenant',
  FREELANCE = 'freelance',
}

@Entity('users')
@Index(['role'])
@Index(['createdAt'])
@Index(['tenantId'])
@Index(['areaId'])
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.FREELANCE,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true, unique: true })
  code: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  documentId: string;

  @ManyToOne(() => Area, { nullable: true })
  @JoinColumn({ name: 'areaId' })
  area: Area;

  @Column({ nullable: true })
  areaId: number;

  @Column({ nullable: true })
  yearsOfExperience: number;

  @Column({ type: 'text', nullable: true })
  skills: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { nullable: true })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ nullable: true })
  tenantId: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  invitationToken: string;

  @Column({ type: 'timestamp', nullable: true })
  invitationExpires: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

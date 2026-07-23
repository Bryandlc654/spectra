import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { RolePermission } from './role-permission.entity';
import { ManagedUser } from '../managed-users/managed-user.entity';

@Entity('custom_roles')
@Index(['createdAt'])
export class CustomRole {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  permissions: RolePermission[];

  @OneToMany(() => ManagedUser, (mu) => mu.role)
  managedUsers: ManagedUser[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

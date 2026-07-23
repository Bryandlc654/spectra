import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CustomRole } from './custom-role.entity';

@Entity('role_permissions')
@Index(['roleId'])
export class RolePermission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  moduleKey: string;

  @Column({ default: true })
  canAccess: boolean;

  @ManyToOne(() => CustomRole, (role) => role.permissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roleId' })
  role: CustomRole;

  @Column()
  roleId: number;
}

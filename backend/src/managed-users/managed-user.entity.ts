import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { CustomRole } from '../custom-roles/custom-role.entity';

@Entity('managed_users')
@Index(['roleId'])
@Index(['createdAt'])
export class ManagedUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @ManyToOne(() => CustomRole)
  @JoinColumn({ name: 'roleId' })
  role: CustomRole;

  @Column()
  roleId: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

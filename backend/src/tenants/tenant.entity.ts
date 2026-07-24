import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { KybRequest } from '../kyb/kyb-request.entity';

@Entity('tenants')
@Index(['createdAt'])
export class Tenant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  taxId: string;

  @Column()
  businessName: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  baseCurrency: string;

  @Column({ default: 'active' })
  status: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToOne(() => KybRequest, { nullable: true, cascade: true })
  @JoinColumn({ name: 'kybRequestId' })
  kybRequest: KybRequest;

  @Column({ nullable: true })
  kybRequestId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

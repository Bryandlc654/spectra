import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from '../tenants/tenant.entity';
import { KybDocument } from './kyb-document.entity';

export enum KybStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('kyb_requests')
export class KybRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: number;

  @Column({ type: 'enum', enum: KybStatus, default: KybStatus.PENDING })
  status: KybStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @OneToMany(() => KybDocument, (doc) => doc.kybRequest, { cascade: true, eager: true })
  documents: KybDocument[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

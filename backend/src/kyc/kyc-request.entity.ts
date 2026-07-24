import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Index } from 'typeorm';
import { KycDocument } from './kyc-document.entity';
import { User } from '../users/user.entity';

export enum KycStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('kyc_requests')
@Index(['userId'])
@Index(['status'])
export class KycRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  userType: string;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  status: KycStatus;

  @Column({ type: 'text', nullable: true })
  adminNotes: string;

  @OneToMany(() => KycDocument, (doc) => doc.kycRequest, { cascade: true })
  documents: KycDocument[];

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

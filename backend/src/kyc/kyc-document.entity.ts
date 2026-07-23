import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { KycRequest } from './kyc-request.entity';

@Entity('kyc_documents')
export class KycDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string;

  @Column()
  originalName: string;

  @Column()
  filePath: string;

  @Column()
  mimeType: string;

  @ManyToOne(() => KycRequest, (req) => req.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kycRequestId' })
  kycRequest: KycRequest;

  @Column()
  kycRequestId: number;

  @CreateDateColumn()
  createdAt: Date;
}

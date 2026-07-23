import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Signer } from './signer.entity';

export enum DocStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  COMPLETED = 'completed',
}

@Entity('sign_documents')
@Index(['ownerUserId'])
export class SignDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  filePath: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  ownerUserId: number;

  @Column({ type: 'enum', enum: DocStatus, default: DocStatus.DRAFT })
  status: DocStatus;

  @OneToMany(() => Signer, (s) => s.document, { cascade: true })
  signers: Signer[];

  @Column({ type: 'text', nullable: true })
  certificateData: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { SignDocument } from './sign-document.entity';

@Entity('signers')
@Index(['documentId'])
@Index(['token'], { unique: true })
export class Signer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => SignDocument, (doc) => doc.signers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'documentId' })
  document: SignDocument;

  @Column()
  documentId: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column({ default: 'signer' })
  role: string;

  @Column({ default: 0 })
  signOrder: number;

  @Column({ default: false })
  hasSigned: boolean;

  @Column({ nullable: true })
  signedAt: Date;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  signatureDataUrl: string;

  @Column({ nullable: true })
  signatureX: number;

  @Column({ nullable: true })
  signatureY: number;

  @Column({ nullable: true })
  signaturePage: number;

  @Column({ nullable: true })
  token: string;

  @CreateDateColumn()
  createdAt: Date;
}

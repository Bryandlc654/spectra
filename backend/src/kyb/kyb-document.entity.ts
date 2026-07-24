import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { KybRequest } from './kyb-request.entity';

@Entity('kyb_documents')
export class KybDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => KybRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kybRequestId' })
  kybRequest: KybRequest;

  @Column()
  kybRequestId: number;

  @Column()
  type: string;

  @Column()
  originalName: string;

  @Column()
  filePath: string;

  @Column()
  mimeType: string;

  @CreateDateColumn()
  createdAt: Date;
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycRequest, KycStatus } from './kyc-request.entity';
import { KycDocument } from './kyc-document.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycRequest)
    private repo: Repository<KycRequest>,
    @InjectRepository(KycDocument)
    private docRepo: Repository<KycDocument>,
    private emailService: EmailService,
  ) {}

  async findAll(page = 1, limit = 50, status?: string, search?: string) {
    const qb = this.repo.createQueryBuilder('kyc')
      .leftJoinAndSelect('kyc.documents', 'docs')
      .leftJoinAndSelect('kyc.user', 'user')
      .orderBy('kyc.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('kyc.status = :status', { status });
    if (search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number) {
    const req = await this.repo.findOne({ where: { id }, relations: ['documents', 'user'] });
    if (!req) throw new NotFoundException('KYC request not found');
    return req;
  }

  async findByUserId(userId: number) {
    return this.repo.findOne({ where: { userId }, relations: ['documents'], order: { createdAt: 'DESC' } });
  }

  async create(userId: number, userType: string) {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    const req = this.repo.create({ userId, userType, status: KycStatus.PENDING });
    return this.repo.save(req);
  }

  async addDocument(kycRequestId: number, type: string, file: Express.Multer.File) {
    const doc = this.docRepo.create({
      kycRequestId,
      type,
      originalName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
    });
    return this.docRepo.save(doc);
  }

  async approve(id: number) {
    const req = await this.findById(id);
    req.status = KycStatus.APPROVED;
    const saved = await this.repo.save(req);

    // Fire-and-forget email notification
    if (req.user?.email) {
      this.emailService.sendKycStatusChanged(req.user.email, req.user.name || '', 'approved').catch((err) => {
        console.error('Failed to send KYC approved email:', err.message);
      });
    }

    return saved;
  }

  async reject(id: number, adminNotes: string) {
    const req = await this.findById(id);
    req.status = KycStatus.REJECTED;
    req.adminNotes = adminNotes;
    const saved = await this.repo.save(req);

    // Fire-and-forget email notification
    if (req.user?.email) {
      this.emailService.sendKycStatusChanged(req.user.email, req.user.name || '', 'rejected', adminNotes).catch((err) => {
        console.error('Failed to send KYC rejected email:', err.message);
      });
    }

    return saved;
  }

  async remove(id: number) {
    const req = await this.findById(id);
    await this.docRepo.delete({ kycRequestId: id });
    return this.repo.remove(req);
  }

  async getStats() {
    const pending = await this.repo.count({ where: { status: KycStatus.PENDING } });
    const approved = await this.repo.count({ where: { status: KycStatus.APPROVED } });
    const rejected = await this.repo.count({ where: { status: KycStatus.REJECTED } });
    return { pending, approved, rejected, total: pending + approved + rejected };
  }
}

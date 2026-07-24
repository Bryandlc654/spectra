import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KycRequest, KycStatus } from './kyc-request.entity';
import { KycDocument } from './kyc-document.entity';

@Injectable()
export class KycService {
  constructor(
    @InjectRepository(KycRequest)
    private repo: Repository<KycRequest>,
    @InjectRepository(KycDocument)
    private docRepo: Repository<KycDocument>,
  ) {}

  async findAll(page = 1, limit = 50, status?: string) {
    const where: any = {};
    if (status) where.status = status;
    const [data, total] = await this.repo.findAndCount({
      where,
      relations: ['documents', 'user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
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
    return this.repo.save(req);
  }

  async reject(id: number, adminNotes: string) {
    const req = await this.findById(id);
    req.status = KycStatus.REJECTED;
    req.adminNotes = adminNotes;
    return this.repo.save(req);
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

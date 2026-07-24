import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KybRequest, KybStatus } from './kyb-request.entity';
import { KybDocument } from './kyb-document.entity';
import { Tenant } from '../tenants/tenant.entity';

@Injectable()
export class KybService {
  constructor(
    @InjectRepository(KybRequest) private kybRepo: Repository<KybRequest>,
    @InjectRepository(KybDocument) private kybDocRepo: Repository<KybDocument>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
  ) {}

  private async getTenantIdForUser(adminId: number, usersRepo: Repository<any>): Promise<number> {
    const user = await usersRepo.findOne({ where: { id: adminId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.tenantId) throw new ForbiddenException('User is not assigned to a tenant');
    return user.tenantId;
  }

  async getKybRequest(adminId: number, usersRepo: Repository<any>): Promise<KybRequest | null> {
    const tenantId = await this.getTenantIdForUser(adminId, usersRepo);
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId }, relations: ['kybRequest', 'kybRequest.documents'] });
    return tenant?.kybRequest || null;
  }

  async createOrGetKybRequest(adminId: number, usersRepo: Repository<any>): Promise<KybRequest> {
    const tenantId = await this.getTenantIdForUser(adminId, usersRepo);
    let tenant = await this.tenantRepo.findOne({ where: { id: tenantId }, relations: ['kybRequest'] });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (tenant.kybRequestId) {
      const existing = await this.kybRepo.findOne({ where: { id: tenant.kybRequestId }, relations: ['documents'] });
      if (existing) return existing;
    }

    const kybRequest = this.kybRepo.create({ tenantId, status: KybStatus.PENDING });
    const saved = await this.kybRepo.save(kybRequest);
    tenant.kybRequestId = saved.id;
    await this.tenantRepo.save(tenant);
    return saved;
  }

  async uploadDocument(adminId: number, usersRepo: Repository<any>, type: string, file: Express.Multer.File): Promise<{ message: string; kybId: number }> {
    const tenantId = await this.getTenantIdForUser(adminId, usersRepo);
    const kybRequest = await this.createOrGetKybRequest(adminId, usersRepo);

    const doc = this.kybDocRepo.create({
      kybRequestId: kybRequest.id,
      type,
      originalName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
    });
    await this.kybDocRepo.save(doc);

    return { message: 'Document uploaded', kybId: kybRequest.id };
  }

  async deleteDocument(adminId: number, usersRepo: Repository<any>, docId: number): Promise<{ message: string }> {
    const tenantId = await this.getTenantIdForUser(adminId, usersRepo);
    const doc = await this.kybDocRepo.findOne({ where: { id: docId }, relations: ['kybRequest'] });
    if (!doc) throw new NotFoundException('Document not found');
    if (doc.kybRequest.tenantId !== tenantId) throw new ForbiddenException('Document not in your tenant');

    await this.kybDocRepo.remove(doc);
    return { message: 'Document deleted' };
  }

  // ─── SUPER ADMIN METHODS ──────────────────────────────────

  async getAllKybRequests(page: number = 1, limit: number = 50, status?: string, search?: string) {
    const qb = this.kybRepo.createQueryBuilder('kyb')
      .leftJoinAndSelect('kyb.tenant', 'tenant')
      .leftJoinAndSelect('kyb.documents', 'documents');

    if (status) {
      qb.andWhere('kyb.status = :status', { status });
    }

    if (search) {
      qb.andWhere('(tenant.businessName ILIKE :search OR tenant.name ILIKE :search OR tenant.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await qb
      .orderBy('kyb.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getKybRequestById(id: number) {
    const kyb = await this.kybRepo.findOne({ where: { id }, relations: ['tenant', 'documents'] });
    if (!kyb) throw new NotFoundException('KYB request not found');
    return kyb;
  }

  async updateKybStatus(id: number, status: KybStatus, adminNotes?: string) {
    const kyb = await this.kybRepo.findOne({ where: { id } });
    if (!kyb) throw new NotFoundException('KYB request not found');
    kyb.status = status;
    if (adminNotes) kyb.adminNotes = adminNotes;
    return this.kybRepo.save(kyb);
  }
}

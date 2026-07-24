import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contract, ContractStatus } from './contract.entity';
import { ContractTemplatesService } from './contract-templates.service';

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(Contract)
    private repo: Repository<Contract>,
    private templatesService: ContractTemplatesService,
  ) {}

  async findAll(filters?: { tenantUserId?: number; freelancerUserId?: number; status?: string; search?: string }, page = 1, limit = 50) {
    const qb = this.repo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.template', 'template')
      .leftJoinAndSelect('contract.signDocument', 'signDocument')
      .leftJoinAndSelect('signDocument.signers', 'signers')
      .orderBy('contract.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.tenantUserId) qb.andWhere('contract.tenantUserId = :tenantUserId', { tenantUserId: filters.tenantUserId });
    if (filters?.freelancerUserId) qb.andWhere('contract.freelancerUserId = :freelancerUserId', { freelancerUserId: filters.freelancerUserId });
    if (filters?.status) qb.andWhere('contract.status = :status', { status: filters.status });
    if (filters?.search) {
      qb.andWhere('(contract.title LIKE :search OR contract.freelancerName LIKE :search OR contract.tenantName LIKE :search)', { search: `%${filters.search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number) {
    const contract = await this.repo.findOne({ where: { id }, relations: ['template', 'signDocument', 'signDocument.signers'] });
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  private renderTemplate(content: string, data: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value || '');
    }
    return result;
  }

  async create(data: {
    templateId: number;
    tenantUserId: number;
    tenantName?: string;
    freelancerUserId: number;
    freelancerName?: string;
    title: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
    customData?: Record<string, string>;
  }) {
    const template = await this.templatesService.findById(data.templateId);

    const placeholders: Record<string, string> = {
      tenant_name: data.tenantName || '',
      freelancer_name: data.freelancerName || '',
      date: new Date().toLocaleDateString('es'),
      start_date: data.startDate || '',
      end_date: data.endDate || '',
      amount: data.amount ? `$${data.amount.toFixed(2)}` : '',
      ...(data.customData || {}),
    };

    const content = this.renderTemplate(template.content, placeholders);

    const contract = this.repo.create({
      templateId: data.templateId,
      tenantUserId: data.tenantUserId,
      tenantName: data.tenantName,
      freelancerUserId: data.freelancerUserId,
      freelancerName: data.freelancerName,
      title: data.title,
      content,
      startDate: data.startDate,
      endDate: data.endDate,
      amount: data.amount,
      status: ContractStatus.DRAFT,
    });

    return this.repo.save(contract);
  }

  async updateStatus(id: number, status: ContractStatus) {
    const contract = await this.findById(id);
    contract.status = status;
    if (status === ContractStatus.SIGNED) contract.signedAt = new Date();
    return this.repo.save(contract);
  }

  async remove(id: number) {
    const contract = await this.findById(id);
    return this.repo.remove(contract);
  }
}

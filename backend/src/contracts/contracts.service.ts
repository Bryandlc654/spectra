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

  async findAll(filters?: { tenantUserId?: number; freelancerUserId?: number; status?: string }) {
    const where: any = {};
    if (filters?.tenantUserId) where.tenantUserId = filters.tenantUserId;
    if (filters?.freelancerUserId) where.freelancerUserId = filters.freelancerUserId;
    if (filters?.status) where.status = filters.status;
    return this.repo.find({ where, relations: ['template'], order: { createdAt: 'DESC' }, take: 200 });
  }

  async findById(id: number) {
    const contract = await this.repo.findOne({ where: { id }, relations: ['template'] });
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

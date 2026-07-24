import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContractTemplate } from './contract-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

@Injectable()
export class ContractTemplatesService {
  constructor(
    @InjectRepository(ContractTemplate)
    private repo: Repository<ContractTemplate>,
  ) {}

  async findAll(userId?: number, tenantId?: number, page = 1, limit = 50) {
    const where: any = {};
    // Si es tenant, mostrar plantillas de sistema (sin tenant) + plantillas de su tenant
    if (tenantId) {
      where.tenantId = tenantId;
      // También incluir plantillas globales (sin tenant)
      const [data, total] = await this.repo.createQueryBuilder('t')
        .where('t.tenantId = :tenantId OR t.tenantId IS NULL', { tenantId })
        .orderBy('t.name', 'ASC')
        .skip((page - 1) * limit)
        .take(limit)
        .getManyAndCount();
      return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    // Si es super admin, mostrar todas
    if (userId) where.createdByUserId = userId;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number, tenantId?: number) {
    const where: any = { id };
    if (tenantId) {
      where.tenantId = tenantId;
      // Permitir también plantillas globales
      const tpl = await this.repo.createQueryBuilder('t')
        .where('t.id = :id AND (t.tenantId = :tenantId OR t.tenantId IS NULL)', { id, tenantId })
        .getOne();
      if (!tpl) throw new NotFoundException('Template not found');
      return tpl;
    }
    const tpl = await this.repo.findOne({ where });
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async create(dto: CreateTemplateDto, userId?: number, tenantId?: number) {
    const tpl = this.repo.create({ ...dto, createdByUserId: userId, tenantId });
    return this.repo.save(tpl);
  }

  async update(id: number, dto: UpdateTemplateDto, tenantId?: number) {
    const tpl = await this.findById(id);
    // Verificar que el tenant sea el propietario o que sea super admin
    if (tenantId && tpl.tenantId !== tenantId) throw new ForbiddenException('You do not own this template');
    Object.assign(tpl, dto);
    return this.repo.save(tpl);
  }

  async remove(id: number, tenantId?: number) {
    const tpl = await this.findById(id);
    if (tenantId && tpl.tenantId !== tenantId) throw new ForbiddenException('You do not own this template');
    return this.repo.remove(tpl);
  }
}

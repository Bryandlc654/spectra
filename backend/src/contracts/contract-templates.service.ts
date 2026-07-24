import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findAll(userId?: number, page = 1, limit = 50) {
    const where: any = {};
    if (userId) where.createdByUserId = userId;
    const [data, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number) {
    const tpl = await this.repo.findOne({ where: { id } });
    if (!tpl) throw new NotFoundException('Template not found');
    return tpl;
  }

  async create(dto: CreateTemplateDto, userId?: number) {
    const tpl = this.repo.create({ ...dto, createdByUserId: userId });
    return this.repo.save(tpl);
  }

  async update(id: number, dto: UpdateTemplateDto) {
    const tpl = await this.findById(id);
    Object.assign(tpl, dto);
    return this.repo.save(tpl);
  }

  async remove(id: number) {
    const tpl = await this.findById(id);
    return this.repo.remove(tpl);
  }
}

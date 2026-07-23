import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private repo: Repository<Tenant>,
  ) {}

  async findAll(page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const ids = data.map((t) => t.id);

    let enriched = data;
    if (ids.length > 0) {
      const counts = await this.repo.manager
        .createQueryBuilder()
        .select('tenantId')
        .addSelect('SUM(CASE WHEN role = :admin THEN 1 ELSE 0 END)', 'adminCount')
        .addSelect('SUM(CASE WHEN role = :freelance THEN 1 ELSE 0 END)', 'freelanceCount')
        .from('users', 'users')
        .where('tenantId IN (:...ids)', { ids })
        .setParameter('admin', 'admin_tenant')
        .setParameter('freelance', 'freelance')
        .groupBy('tenantId')
        .getRawMany();

      const countMap = new Map(counts.map((c: any) => [c.tenantId, { admins: Number(c.adminCount), freelancers: Number(c.freelanceCount) }]));

      enriched = data.map((t) => ({
        ...t,
        adminTenantsCount: countMap.get(t.id)?.admins ?? 0,
        freelancersCount: countMap.get(t.id)?.freelancers ?? 0,
      }));
    }

    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number) {
    const tenant = await this.repo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findUsers(id: number, page = 1, limit = 50) {
    await this.findById(id);
    const [data, total] = await this.repo.manager.getRepository('User').findAndCount({
      where: { tenantId: id },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async create(dto: CreateTenantDto) {
    const tenant = this.repo.create(dto);
    return this.repo.save(tenant);
  }

  async update(id: number, dto: UpdateTenantDto) {
    const tenant = await this.findById(id);
    Object.assign(tenant, dto);
    return this.repo.save(tenant);
  }

  async remove(id: number) {
    const tenant = await this.findById(id);
    return this.repo.remove(tenant);
  }
}

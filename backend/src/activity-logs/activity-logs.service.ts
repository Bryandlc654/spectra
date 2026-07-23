import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { ActivityLog } from './activity-log.entity';

@Injectable()
export class ActivityLogsService {
  private readonly RETENTION_DAYS = 90;

  constructor(
    @InjectRepository(ActivityLog)
    private repo: Repository<ActivityLog>,
  ) {}

  async log(data: {
    userId: number;
    userName?: string;
    action: string;
    entityType: string;
    entityId?: number;
    description?: string;
    metadata?: any;
  }) {
    const entry = this.repo.create(data);
    await this.repo.save(entry);
  }

  async findAll(page = 1, limit = 50, filters?: { action?: string; entityType?: string; userId?: number }) {
    const where: any = {};
    if (filters?.action) where.action = filters.action;
    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.userId) where.userId = filters.userId;

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getDistinctActions() {
    const raw = await this.repo
      .createQueryBuilder('log')
      .select('DISTINCT log.action', 'action')
      .orderBy('log.action')
      .getRawMany();
    return raw.map((r: any) => r.action);
  }

  async getDistinctEntityTypes() {
    const raw = await this.repo
      .createQueryBuilder('log')
      .select('DISTINCT log.entityType', 'entityType')
      .orderBy('log.entityType')
      .getRawMany();
    return raw.map((r: any) => r.entityType);
  }

  async cleanupOldLogs() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.RETENTION_DAYS);
    const result = await this.repo.delete({ createdAt: LessThan(cutoff) });
    return { deleted: result.affected };
  }
}

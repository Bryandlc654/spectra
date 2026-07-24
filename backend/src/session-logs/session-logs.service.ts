import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionLog } from './session-log.entity';

@Injectable()
export class SessionLogsService {
  constructor(
    @InjectRepository(SessionLog)
    private repo: Repository<SessionLog>,
  ) {}

  async log(data: { userId: number; userName?: string; userRole?: string; ipAddress?: string; userAgent?: string }) {
    const entry = this.repo.create(data);
    await this.repo.save(entry);
  }

  async findAll(page = 1, limit = 50, search?: string) {
    const qb = this.repo.createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(log.userName LIKE :search OR log.action LIKE :search OR log.entityType LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

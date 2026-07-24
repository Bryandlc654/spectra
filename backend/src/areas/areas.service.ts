import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from './area.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
  constructor(
    @InjectRepository(Area)
    private repo: Repository<Area>,
  ) {}

  async findAll(page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number) {
    const area = await this.repo.findOne({ where: { id } });
    if (!area) throw new NotFoundException('Area not found');
    return area;
  }

  async create(dto: CreateAreaDto) {
    const area = this.repo.create(dto);
    return this.repo.save(area);
  }

  async update(id: number, dto: UpdateAreaDto) {
    const area = await this.findById(id);
    Object.assign(area, dto);
    return this.repo.save(area);
  }

  async remove(id: number) {
    const area = await this.findById(id);
    return this.repo.remove(area);
  }
}

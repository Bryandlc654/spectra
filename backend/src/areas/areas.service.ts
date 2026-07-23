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

  async findAll() {
    return this.repo.find({ order: { name: 'ASC' } });
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

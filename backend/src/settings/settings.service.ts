import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from './setting.entity';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private repo: Repository<Setting>,
  ) {}

  async findAll() {
    return this.repo.find({ order: { key: 'ASC' } });
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.repo.findOne({ where: { key } });
    return setting?.value ?? null;
  }

  async getAll(keys: string[]): Promise<Record<string, string | null>> {
    const settings = await this.repo.find({ where: keys.map((k) => ({ key: k })) });
    const result: Record<string, string | null> = {};
    keys.forEach((k) => {
      const found = settings.find((s) => s.key === k);
      result[k] = found?.value ?? null;
    });
    return result;
  }

  async set(key: string, value: string) {
    const existing = await this.repo.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      return this.repo.save(existing);
    }
    const setting = this.repo.create({ key, value });
    return this.repo.save(setting);
  }

  async setBulk(entries: { key: string; value: string }[]) {
    if (entries.length === 0) return this.findAll();
    const keys = entries.map((e) => e.key);
    const existing = await this.repo.find({ where: keys.map((k) => ({ key: k })) });
    const existingMap = new Map(existing.map((s) => [s.key, s]));

    const toSave: Setting[] = [];
    for (const entry of entries) {
      const found = existingMap.get(entry.key);
      if (found) {
        found.value = entry.value;
        toSave.push(found);
      } else {
        toSave.push(this.repo.create(entry));
      }
    }
    await this.repo.save(toSave);
    return this.findAll();
  }

  async remove(key: string) {
    const setting = await this.repo.findOne({ where: { key } });
    if (setting) await this.repo.remove(setting);
  }
}

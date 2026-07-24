import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomRole } from './custom-role.entity';
import { RolePermission } from './role-permission.entity';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';

@Injectable()
export class CustomRolesService {
  constructor(
    @InjectRepository(CustomRole)
    private repo: Repository<CustomRole>,
    @InjectRepository(RolePermission)
    private permRepo: Repository<RolePermission>,
  ) {}

  async findAll(page = 1, limit = 50) {
    const [data, total] = await this.repo.findAndCount({
      relations: ['permissions'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number) {
    const role = await this.repo.findOne({ where: { id }, relations: ['permissions'] });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateCustomRoleDto) {
    const { permissions, ...rest } = dto;
    const role = this.repo.create(rest);
    const saved = await this.repo.save(role);
    if (permissions?.length) {
      const perms = permissions.map((p) => this.permRepo.create({ ...p, roleId: saved.id }));
      await this.permRepo.save(perms);
    }
    return this.findById(saved.id);
  }

  async update(id: number, dto: UpdateCustomRoleDto) {
    const { permissions, ...rest } = dto;
    const role = await this.findById(id);
    Object.assign(role, rest);
    await this.repo.save(role);
    if (permissions) {
      const currentPerms = role.permissions;
      const currentMap = new Map(currentPerms.map((p) => [p.moduleKey, p]));

      for (const p of permissions) {
        const existing = currentMap.get(p.moduleKey);
        if (existing) {
          if (existing.canAccess !== p.canAccess) {
            existing.canAccess = p.canAccess;
            await this.permRepo.save(existing);
          }
        } else {
          await this.permRepo.save(this.permRepo.create({ ...p, roleId: id }));
        }
      }

      const newKeys = new Set(permissions.map((p) => p.moduleKey));
      for (const perm of currentPerms) {
        if (!newKeys.has(perm.moduleKey)) {
          await this.permRepo.remove(perm);
        }
      }
    }
    return this.findById(id);
  }

  async remove(id: number) {
    const role = await this.findById(id);
    return this.repo.remove(role);
  }
}

"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRolesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const custom_role_entity_1 = require("./custom-role.entity");
const role_permission_entity_1 = require("./role-permission.entity");
let CustomRolesService = class CustomRolesService {
    constructor(repo, permRepo) {
        this.repo = repo;
        this.permRepo = permRepo;
    }
    async findAll() {
        return this.repo.find({ relations: ['permissions'], order: { createdAt: 'DESC' } });
    }
    async findById(id) {
        const role = await this.repo.findOne({ where: { id }, relations: ['permissions'] });
        if (!role)
            throw new common_1.NotFoundException('Role not found');
        return role;
    }
    async create(dto) {
        const { permissions, ...rest } = dto;
        const role = this.repo.create(rest);
        const saved = await this.repo.save(role);
        if (permissions?.length) {
            const perms = permissions.map((p) => this.permRepo.create({ ...p, roleId: saved.id }));
            await this.permRepo.save(perms);
        }
        return this.findById(saved.id);
    }
    async update(id, dto) {
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
                }
                else {
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
    async remove(id) {
        const role = await this.findById(id);
        return this.repo.remove(role);
    }
};
exports.CustomRolesService = CustomRolesService;
exports.CustomRolesService = CustomRolesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(custom_role_entity_1.CustomRole)),
    __param(1, (0, typeorm_1.InjectRepository)(role_permission_entity_1.RolePermission)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], CustomRolesService);
//# sourceMappingURL=custom-roles.service.js.map
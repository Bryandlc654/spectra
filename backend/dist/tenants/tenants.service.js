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
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const tenant_entity_1 = require("./tenant.entity");
let TenantsService = class TenantsService {
    constructor(repo) {
        this.repo = repo;
    }
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
            const countMap = new Map(counts.map((c) => [c.tenantId, { admins: Number(c.adminCount), freelancers: Number(c.freelanceCount) }]));
            enriched = data.map((t) => ({
                ...t,
                adminTenantsCount: countMap.get(t.id)?.admins ?? 0,
                freelancersCount: countMap.get(t.id)?.freelancers ?? 0,
            }));
        }
        return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findById(id) {
        const tenant = await this.repo.findOne({ where: { id } });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    async findUsers(id, page = 1, limit = 50) {
        await this.findById(id);
        const [data, total] = await this.repo.manager.getRepository('User').findAndCount({
            where: { tenantId: id },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async create(dto) {
        const tenant = this.repo.create(dto);
        return this.repo.save(tenant);
    }
    async update(id, dto) {
        const tenant = await this.findById(id);
        Object.assign(tenant, dto);
        return this.repo.save(tenant);
    }
    async remove(id) {
        const tenant = await this.findById(id);
        return this.repo.remove(tenant);
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map
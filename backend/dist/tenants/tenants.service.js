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
    async findAll() {
        const tenants = await this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
        const ids = tenants.map((t) => t.id);
        if (ids.length === 0)
            return tenants;
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
        return tenants.map((t) => ({
            ...t,
            adminTenantsCount: countMap.get(t.id)?.admins ?? 0,
            freelancersCount: countMap.get(t.id)?.freelancers ?? 0,
        }));
    }
    async findById(id) {
        const tenant = await this.repo.findOne({ where: { id }, relations: ['users'] });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
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
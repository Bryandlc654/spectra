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
exports.ActivityLogsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const activity_log_entity_1 = require("./activity-log.entity");
let ActivityLogsService = class ActivityLogsService {
    constructor(repo) {
        this.repo = repo;
        this.RETENTION_DAYS = 90;
    }
    async log(data) {
        const entry = this.repo.create(data);
        await this.repo.save(entry);
    }
    async findAll(page = 1, limit = 50, filters) {
        const where = {};
        if (filters?.action)
            where.action = filters.action;
        if (filters?.entityType)
            where.entityType = filters.entityType;
        if (filters?.userId)
            where.userId = filters.userId;
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
        return raw.map((r) => r.action);
    }
    async getDistinctEntityTypes() {
        const raw = await this.repo
            .createQueryBuilder('log')
            .select('DISTINCT log.entityType', 'entityType')
            .orderBy('log.entityType')
            .getRawMany();
        return raw.map((r) => r.entityType);
    }
    async cleanupOldLogs() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.RETENTION_DAYS);
        const result = await this.repo.delete({ createdAt: (0, typeorm_2.LessThan)(cutoff) });
        return { deleted: result.affected };
    }
};
exports.ActivityLogsService = ActivityLogsService;
exports.ActivityLogsService = ActivityLogsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(activity_log_entity_1.ActivityLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ActivityLogsService);
//# sourceMappingURL=activity-logs.service.js.map
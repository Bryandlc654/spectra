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
exports.ContractsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const contract_entity_1 = require("./contract.entity");
const contract_templates_service_1 = require("./contract-templates.service");
let ContractsService = class ContractsService {
    constructor(repo, templatesService) {
        this.repo = repo;
        this.templatesService = templatesService;
    }
    async findAll(filters) {
        const where = {};
        if (filters?.tenantUserId)
            where.tenantUserId = filters.tenantUserId;
        if (filters?.freelancerUserId)
            where.freelancerUserId = filters.freelancerUserId;
        if (filters?.status)
            where.status = filters.status;
        return this.repo.find({ where, relations: ['template'], order: { createdAt: 'DESC' }, take: 200 });
    }
    async findById(id) {
        const contract = await this.repo.findOne({ where: { id }, relations: ['template'] });
        if (!contract)
            throw new common_1.NotFoundException('Contract not found');
        return contract;
    }
    renderTemplate(content, data) {
        let result = content;
        for (const [key, value] of Object.entries(data)) {
            result = result.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value || '');
        }
        return result;
    }
    async create(data) {
        const template = await this.templatesService.findById(data.templateId);
        const placeholders = {
            tenant_name: data.tenantName || '',
            freelancer_name: data.freelancerName || '',
            date: new Date().toLocaleDateString('es'),
            start_date: data.startDate || '',
            end_date: data.endDate || '',
            amount: data.amount ? `$${data.amount.toFixed(2)}` : '',
            ...(data.customData || {}),
        };
        const content = this.renderTemplate(template.content, placeholders);
        const contract = this.repo.create({
            templateId: data.templateId,
            tenantUserId: data.tenantUserId,
            tenantName: data.tenantName,
            freelancerUserId: data.freelancerUserId,
            freelancerName: data.freelancerName,
            title: data.title,
            content,
            startDate: data.startDate,
            endDate: data.endDate,
            amount: data.amount,
            status: contract_entity_1.ContractStatus.DRAFT,
        });
        return this.repo.save(contract);
    }
    async updateStatus(id, status) {
        const contract = await this.findById(id);
        contract.status = status;
        if (status === contract_entity_1.ContractStatus.SIGNED)
            contract.signedAt = new Date();
        return this.repo.save(contract);
    }
    async remove(id) {
        const contract = await this.findById(id);
        return this.repo.remove(contract);
    }
};
exports.ContractsService = ContractsService;
exports.ContractsService = ContractsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        contract_templates_service_1.ContractTemplatesService])
], ContractsService);
//# sourceMappingURL=contracts.service.js.map
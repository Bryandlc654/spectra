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
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const kyc_request_entity_1 = require("./kyc-request.entity");
const kyc_document_entity_1 = require("./kyc-document.entity");
let KycService = class KycService {
    constructor(repo, docRepo) {
        this.repo = repo;
        this.docRepo = docRepo;
    }
    async findAll(page = 1, limit = 50, status) {
        const where = {};
        if (status)
            where.status = status;
        const [data, total] = await this.repo.findAndCount({
            where,
            relations: ['documents', 'user'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async findById(id) {
        const req = await this.repo.findOne({ where: { id }, relations: ['documents', 'user'] });
        if (!req)
            throw new common_1.NotFoundException('KYC request not found');
        return req;
    }
    async findByUserId(userId) {
        return this.repo.findOne({ where: { userId }, relations: ['documents'], order: { createdAt: 'DESC' } });
    }
    async create(userId, userType) {
        const existing = await this.findByUserId(userId);
        if (existing)
            return existing;
        const req = this.repo.create({ userId, userType, status: kyc_request_entity_1.KycStatus.PENDING });
        return this.repo.save(req);
    }
    async addDocument(kycRequestId, type, file) {
        const doc = this.docRepo.create({
            kycRequestId,
            type,
            originalName: file.originalname,
            filePath: `/uploads/${file.filename}`,
            mimeType: file.mimetype,
        });
        return this.docRepo.save(doc);
    }
    async approve(id) {
        const req = await this.findById(id);
        req.status = kyc_request_entity_1.KycStatus.APPROVED;
        return this.repo.save(req);
    }
    async reject(id, adminNotes) {
        const req = await this.findById(id);
        req.status = kyc_request_entity_1.KycStatus.REJECTED;
        req.adminNotes = adminNotes;
        return this.repo.save(req);
    }
    async remove(id) {
        const req = await this.findById(id);
        await this.docRepo.delete({ kycRequestId: id });
        return this.repo.remove(req);
    }
    async getStats() {
        const pending = await this.repo.count({ where: { status: kyc_request_entity_1.KycStatus.PENDING } });
        const approved = await this.repo.count({ where: { status: kyc_request_entity_1.KycStatus.APPROVED } });
        const rejected = await this.repo.count({ where: { status: kyc_request_entity_1.KycStatus.REJECTED } });
        return { pending, approved, rejected, total: pending + approved + rejected };
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(kyc_request_entity_1.KycRequest)),
    __param(1, (0, typeorm_1.InjectRepository)(kyc_document_entity_1.KycDocument)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], KycService);
//# sourceMappingURL=kyc.service.js.map
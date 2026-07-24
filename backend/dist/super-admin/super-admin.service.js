"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const user_entity_1 = require("../users/user.entity");
const email_service_1 = require("../email/email.service");
const tenants_service_1 = require("../tenants/tenants.service");
const kyc_service_1 = require("../kyc/kyc.service");
let SuperAdminService = class SuperAdminService {
    constructor(usersRepository, emailService, tenantsService, kycService, jwtService) {
        this.usersRepository = usersRepository;
        this.emailService = emailService;
        this.tenantsService = tenantsService;
        this.kycService = kycService;
        this.jwtService = jwtService;
    }
    async getDashboard() {
        const [totalUsers, admins, freelancers, recentUsers] = await Promise.all([
            this.usersRepository.count(),
            this.usersRepository.count({ where: { role: user_entity_1.UserRole.ADMIN_TENANT } }),
            this.usersRepository.count({ where: { role: user_entity_1.UserRole.FREELANCE } }),
            this.usersRepository.find({ order: { createdAt: 'DESC' }, take: 5 }),
        ]);
        return {
            stats: { totalUsers, admins, freelancers },
            recentUsers,
        };
    }
    async getAdminTenants(page = 1, limit = 50) {
        const [data, total] = await this.usersRepository.findAndCount({
            where: { role: user_entity_1.UserRole.ADMIN_TENANT },
            relations: ['tenant'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async createAdminTenant(data) {
        const existing = await this.usersRepository.findOne({ where: { email: data.email } });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const invitationToken = this.jwtService.sign({ sub: 0, email: data.email, type: 'admin_invitation' }, { expiresIn: '7d' });
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const user = this.usersRepository.create({
            name: data.name,
            email: data.email,
            password: await bcrypt.hash('PENDING', 10),
            phone: data.phone,
            role: user_entity_1.UserRole.ADMIN_TENANT,
            tenantId: data.tenantId ?? undefined,
            invitationToken,
            invitationExpires,
        });
        const saved = await this.usersRepository.save(user);
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const inviteUrl = `${appUrl}/accept-invitation/${invitationToken}`;
        let tenantName;
        if (data.tenantId) {
            try {
                const tenant = await this.tenantsService.findById(data.tenantId);
                tenantName = tenant.businessName;
            }
            catch { }
        }
        await this.emailService.sendInvitation(data.email, data.name, inviteUrl, tenantName).catch((err) => {
            console.error('Failed to send invitation email:', err.message);
        });
        await this.kycService.create(saved.id, 'admin_tenant');
        return saved;
    }
    async updateAdminTenant(id, data) {
        const user = await this.usersRepository.findOne({ where: { id, role: user_entity_1.UserRole.ADMIN_TENANT } });
        if (!user)
            throw new common_1.NotFoundException('Admin tenant not found');
        Object.assign(user, data);
        return this.usersRepository.save(user);
    }
    async deleteAdminTenant(id) {
        const user = await this.usersRepository.findOne({ where: { id, role: user_entity_1.UserRole.ADMIN_TENANT } });
        if (!user)
            throw new common_1.NotFoundException('Admin tenant not found');
        return this.usersRepository.remove(user);
    }
    async getFreelancers(page = 1, limit = 50) {
        const [data, total] = await this.usersRepository.findAndCount({
            where: { role: user_entity_1.UserRole.FREELANCE },
            relations: ['tenant', 'area'],
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
    }
    async createFreelancer(data) {
        const existing = await this.usersRepository.findOne({ where: { email: data.email } });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const invitationToken = this.jwtService.sign({ sub: 0, email: data.email, type: 'admin_invitation' }, { expiresIn: '7d' });
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        let code = '';
        for (let attempt = 0; attempt < 10; attempt++) {
            code = String(Math.floor(100000 + Math.random() * 900000));
            const dup = await this.usersRepository.findOne({ where: { code } });
            if (!dup)
                break;
        }
        const user = this.usersRepository.create({
            name: data.name, email: data.email, password: await bcrypt.hash('PENDING', 10), code,
            phone: data.phone, country: data.country, documentId: data.documentId,
            areaId: data.areaId, yearsOfExperience: data.yearsOfExperience,
            skills: data.skills, bio: data.bio,
            role: user_entity_1.UserRole.FREELANCE,
            tenantId: data.tenantId ?? undefined,
            invitationToken,
            invitationExpires,
        });
        const saved = await this.usersRepository.save(user);
        const appUrl = process.env.APP_URL || 'http://localhost:5173';
        const inviteUrl = `${appUrl}/accept-invitation/${invitationToken}`;
        await this.emailService.sendInvitation(data.email, data.name, inviteUrl).catch((err) => {
            console.error('Failed to send invitation email:', err.message);
        });
        await this.kycService.create(saved.id, 'freelance');
        return saved;
    }
    async updateFreelancer(id, data) {
        const user = await this.usersRepository.findOne({ where: { id, role: user_entity_1.UserRole.FREELANCE } });
        if (!user)
            throw new common_1.NotFoundException('Freelancer not found');
        if (data.password)
            data.password = await bcrypt.hash(data.password, 10);
        Object.assign(user, data);
        return this.usersRepository.save(user);
    }
    async deleteFreelancer(id) {
        const user = await this.usersRepository.findOne({ where: { id, role: user_entity_1.UserRole.FREELANCE } });
        if (!user)
            throw new common_1.NotFoundException('Freelancer not found');
        return this.usersRepository.remove(user);
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        email_service_1.EmailService,
        tenants_service_1.TenantsService,
        kyc_service_1.KycService,
        jwt_1.JwtService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map
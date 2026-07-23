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
exports.SignaturesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const signatures_service_1 = require("./signatures.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const uploadDir = (0, path_1.join)(__dirname, '../../uploads');
const ALLOWED_MIMES = [
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/png',
];
let SignaturesController = class SignaturesController {
    constructor(service) {
        this.service = service;
    }
    findAll(req) {
        const userId = req.user.role === 'super_admin' ? undefined : req.user.id;
        return this.service.findAll(userId);
    }
    findOne(id) { return this.service.findById(+id); }
    async create(req, body, file) {
        if (!file)
            throw new common_1.BadRequestException('No file uploaded');
        return this.service.create({ title: body.title, description: body.description, file, ownerUserId: req.user.id });
    }
    addSigner(id, body) {
        return this.service.addSigner(+id, body);
    }
    removeSigner(signerId) { return this.service.removeSigner(+signerId); }
    async send(req, id) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        return this.service.send(+id, baseUrl);
    }
    async getByToken(token) {
        return this.service.getByToken(token);
    }
    async sign(token, body, req) {
        return this.service.sign(token, body.signature, req.ip, body.x, body.y);
    }
    async remove(id) {
        const doc = await this.service.findById(+id);
        if (doc.ownerUserId !== undefined) {
        }
        return this.service.remove(+id);
    }
    async getCertificate(id, res) {
        const doc = await this.service.findById(+id);
        if (!doc.certificateData)
            throw new common_1.NotFoundException('Document not completed');
        res.setHeader('Content-Type', 'text/html');
        res.send(doc.certificateData);
    }
};
exports.SignaturesController = SignaturesController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SignaturesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SignaturesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: uploadDir,
            filename: (_req, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, unique + (0, path_1.extname)(file.originalname));
            },
        }),
        limits: { fileSize: 20 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (ALLOWED_MIMES.includes(file.mimetype))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('File type not allowed'), false);
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], SignaturesController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/signers'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SignaturesController.prototype, "addSigner", null);
__decorate([
    (0, common_1.Delete)(':id/signers/:signerId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('signerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SignaturesController.prototype, "removeSigner", null);
__decorate([
    (0, common_1.Post)(':id/send'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SignaturesController.prototype, "send", null);
__decorate([
    (0, common_1.Get)('token/:token'),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SignaturesController.prototype, "getByToken", null);
__decorate([
    (0, common_1.Post)('token/:token/sign'),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SignaturesController.prototype, "sign", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SignaturesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/certificate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SignaturesController.prototype, "getCertificate", null);
exports.SignaturesController = SignaturesController = __decorate([
    (0, common_1.Controller)('signatures'),
    __metadata("design:paramtypes", [signatures_service_1.SignaturesService])
], SignaturesController);
//# sourceMappingURL=signatures.controller.js.map
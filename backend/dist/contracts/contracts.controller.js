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
exports.ContractsController = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = require('pdfkit');
const contract_templates_service_1 = require("./contract-templates.service");
const contracts_service_1 = require("./contracts.service");
const create_template_dto_1 = require("./dto/create-template.dto");
const update_template_dto_1 = require("./dto/update-template.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
let ContractsController = class ContractsController {
    constructor(templatesService, contractsService) {
        this.templatesService = templatesService;
        this.contractsService = contractsService;
    }
    getTemplates(req) {
        const userId = req.user.role === 'super_admin' ? undefined : req.user.id;
        return this.templatesService.findAll(userId);
    }
    getTemplate(id) { return this.templatesService.findById(+id); }
    createTemplate(req, dto) {
        return this.templatesService.create(dto, req.user.id);
    }
    async getTemplatePdf(id, res) {
        const tpl = await this.templatesService.findById(+id);
        const doc = new PDFDocument({ margin: 60, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="plantilla-${tpl.id}.pdf"`);
        doc.pipe(res);
        const c = '#006d70';
        const ml = 60;
        const pw = 475;
        doc.rect(ml, 40, pw, 60).lineWidth(2).strokeColor(c).stroke();
        doc.fontSize(18).font('Helvetica-Bold').fillColor(c).text(tpl.name, ml, 52, { align: 'center', width: pw });
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#999').text('Vista previa de plantilla', { align: 'center', width: pw });
        const divY = 120;
        doc.moveTo(ml, divY).lineTo(ml + pw, divY).lineWidth(1.5).strokeColor(c).stroke();
        doc.fontSize(8).font('Helvetica').fillColor('#999').text('CONTENIDO', ml, divY + 6, { align: 'center', width: pw });
        let currentY = divY + 22;
        const lines = tpl.content.split('\n').filter((l) => l.trim());
        for (const line of lines) {
            const trimmed = line.trim();
            if (currentY > 720) {
                doc.addPage();
                currentY = 60;
            }
            if (trimmed.startsWith('CONTRATO') || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{4,}$/)) {
                doc.font('Helvetica-Bold').fontSize(12).fillColor(c);
                currentY += 4;
            }
            else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA):/)) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor(c);
                currentY += 4;
            }
            else {
                doc.font('Helvetica').fontSize(10).fillColor('#333');
            }
            doc.text(trimmed, ml, currentY, { width: pw, align: 'justify', lineGap: 2 });
            currentY = doc.y + 4;
        }
        const footerY = Math.max(currentY + 30, 700);
        doc.moveTo(ml, footerY).lineTo(ml + pw, footerY).lineWidth(0.5).strokeColor('#ddd').stroke();
        doc.fontSize(7.5).font('Helvetica').fillColor('#aaa')
            .text('Spectra Platform · Vista previa generada electrónicamente', ml, footerY + 5, { align: 'center', width: pw });
        doc.end();
    }
    updateTemplate(id, dto) { return this.templatesService.update(+id, dto); }
    deleteTemplate(id) { return this.templatesService.remove(+id); }
    findAll(req) {
        const filters = {};
        if (req.user.role === 'admin_tenant')
            filters.tenantUserId = req.user.id;
        return this.contractsService.findAll(filters);
    }
    findOne(id) { return this.contractsService.findById(+id); }
    create(req, body) {
        return this.contractsService.create({
            ...body,
            tenantUserId: body.tenantUserId || req.user.id,
            tenantName: body.tenantName || req.user.name,
        });
    }
    updateStatus(id, body) {
        return this.contractsService.updateStatus(+id, body.status);
    }
    async getPdf(id, res) {
        const contract = await this.contractsService.findById(+id);
        const doc = new PDFDocument({ margin: 60, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="contrato-${contract.id}.pdf"`);
        doc.pipe(res);
        const c = '#006d70';
        const ml = 60;
        const pw = 475;
        doc.rect(ml, 40, pw, 90).lineWidth(2).strokeColor(c).stroke();
        doc.fontSize(20).font('Helvetica-Bold').fillColor(c)
            .text(contract.title, ml, 55, { align: 'center', width: pw });
        doc.fontSize(9).font('Helvetica').fillColor('#666')
            .text(`N° ${String(contract.id).padStart(6, '0')} · ${new Date().toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}`, { align: 'center', width: pw });
        doc.moveDown(0.3);
        doc.fontSize(8).font('Helvetica-Oblique').fillColor('#999')
            .text('Documento electrónico con validez legal', { align: 'center', width: pw });
        const infoY = 150;
        doc.rect(ml, infoY - 5, pw, 55).lineWidth(0.5).strokeColor('#ddd').stroke();
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
            .text('CONTRATANTE', ml + 10, infoY + 3);
        doc.fontSize(9.5).font('Helvetica').fillColor('#333')
            .text(contract.tenantName || `ID ${contract.tenantUserId}`, ml + 10, infoY + 18);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
            .text('CONTRATISTA', ml + pw / 2 + 5, infoY + 3);
        doc.fontSize(9.5).font('Helvetica').fillColor('#333')
            .text(contract.freelancerName || `ID ${contract.freelancerUserId}`, ml + pw / 2 + 5, infoY + 18);
        const divY = infoY + 60;
        doc.moveTo(ml, divY).lineTo(ml + pw, divY).lineWidth(1.5).strokeColor(c).stroke();
        doc.fontSize(8).font('Helvetica').fillColor('#999')
            .text('CLÁUSULAS', ml, divY + 6, { align: 'center', width: pw });
        const startY = divY + 22;
        const stripHtml = (html) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const text = stripHtml(contract.content);
        const lines = text.split('\n').filter((l) => l.trim());
        let currentY = startY;
        const lineHeight = 18;
        for (const line of lines) {
            const trimmed = line.trim();
            if (currentY > 720) {
                doc.addPage();
                currentY = 60;
            }
            if (trimmed.startsWith('CONTRATO') || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{4,}$/)) {
                doc.font('Helvetica-Bold').fontSize(12).fillColor(c);
                currentY += 4;
            }
            else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA):/)) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor(c);
                currentY += 4;
            }
            else if (trimmed.startsWith('_') || trimmed.match(/^_{3,}/)) {
                currentY += 8;
                continue;
            }
            else {
                doc.font('Helvetica').fontSize(10).fillColor('#333');
            }
            doc.text(trimmed, ml, currentY, { width: pw, align: 'justify', lineGap: 2 });
            currentY = doc.y + 4;
        }
        if (currentY > 660)
            doc.addPage();
        const sigY = Math.max(currentY + 30, 680);
        doc.moveTo(ml, sigY).lineTo(ml + pw, sigY).lineWidth(0.5).strokeColor('#ccc').stroke();
        doc.fontSize(10).font('Helvetica-Bold').fillColor('#333')
            .text('FIRMAS', ml, sigY + 10, { align: 'center', width: pw });
        const lineLen = 180;
        const gap = 30;
        const sigLineY = sigY + 45;
        doc.moveTo(ml + 40, sigLineY).lineTo(ml + 40 + lineLen, sigLineY).lineWidth(1).strokeColor('#333').stroke();
        doc.moveTo(ml + pw - 40 - lineLen, sigLineY).lineTo(ml + pw - 40, sigLineY).lineWidth(1).strokeColor('#333').stroke();
        doc.fontSize(9).font('Helvetica').fillColor('#333')
            .text(contract.tenantName || 'CONTRATANTE', ml + 40, sigLineY + 5, { width: lineLen, align: 'center' });
        doc.text(contract.freelancerName || 'CONTRATISTA', ml + pw - 40 - lineLen, sigLineY + 5, { width: lineLen, align: 'center' });
        doc.fontSize(7).font('Helvetica-Oblique').fillColor('#999')
            .text('CONTRATANTE', ml + 40, sigLineY + 18, { width: lineLen, align: 'center' });
        doc.text('CONTRATISTA', ml + pw - 40 - lineLen, sigLineY + 18, { width: lineLen, align: 'center' });
        const footerY = sigLineY + 45;
        doc.moveTo(ml, footerY).lineTo(ml + pw, footerY).lineWidth(0.5).strokeColor('#ddd').stroke();
        doc.fontSize(7.5).font('Helvetica').fillColor('#aaa')
            .text('Spectra Platform · Documento generado electrónicamente · ID: ' + contract.id, ml, footerY + 5, { align: 'center', width: pw });
        doc.end();
    }
    remove(id) { return this.contractsService.remove(+id); }
};
exports.ContractsController = ContractsController;
__decorate([
    (0, common_1.Get)('templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "getTemplate", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_template_dto_1.CreateTemplateDto]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)('templates/:id/pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getTemplatePdf", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_template_dto_1.UpdateTemplateDto]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "updateStatus", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ContractsController.prototype, "getPdf", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin', 'admin_tenant'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ContractsController.prototype, "remove", null);
exports.ContractsController = ContractsController = __decorate([
    (0, common_1.Controller)('contracts'),
    __metadata("design:paramtypes", [contract_templates_service_1.ContractTemplatesService,
        contracts_service_1.ContractsService])
], ContractsController);
//# sourceMappingURL=contracts.controller.js.map
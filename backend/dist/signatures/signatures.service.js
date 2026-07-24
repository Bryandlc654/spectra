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
var SignaturesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignaturesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const crypto = __importStar(require("crypto"));
const sign_document_entity_1 = require("./sign-document.entity");
const signer_entity_1 = require("./signer.entity");
const email_service_1 = require("../email/email.service");
let SignaturesService = SignaturesService_1 = class SignaturesService {
    constructor(docRepo, signerRepo, emailService) {
        this.docRepo = docRepo;
        this.signerRepo = signerRepo;
        this.emailService = emailService;
        this.logger = new common_1.Logger(SignaturesService_1.name);
    }
    async findAll(ownerUserId) {
        const where = {};
        if (ownerUserId)
            where.ownerUserId = ownerUserId;
        return this.docRepo.find({ where, relations: ['signers'], order: { createdAt: 'DESC' }, take: 200 });
    }
    async findById(id) {
        const doc = await this.docRepo.findOne({ where: { id }, relations: ['signers'] });
        if (!doc)
            throw new common_1.NotFoundException('Document not found');
        return doc;
    }
    async create(data) {
        const doc = this.docRepo.create({
            title: data.title,
            description: data.description,
            filePath: `/uploads/${data.file.filename}`,
            originalName: data.file.originalname,
            mimeType: data.file.mimetype,
            ownerUserId: data.ownerUserId,
            status: sign_document_entity_1.DocStatus.DRAFT,
        });
        return this.docRepo.save(doc);
    }
    async addSigner(documentId, data) {
        const doc = await this.findById(documentId);
        if (doc.status !== sign_document_entity_1.DocStatus.DRAFT)
            throw new common_1.BadRequestException('Document already sent');
        const token = crypto.randomBytes(32).toString('hex');
        const signer = this.signerRepo.create({
            documentId,
            name: data.name,
            email: data.email,
            role: data.role || 'signer',
            signOrder: data.signOrder || 0,
            token,
        });
        return this.signerRepo.save(signer);
    }
    async removeSigner(signerId) {
        const signer = await this.signerRepo.findOne({ where: { id: signerId }, relations: ['document'] });
        if (!signer)
            throw new common_1.NotFoundException('Signer not found');
        if (signer.document.status !== sign_document_entity_1.DocStatus.DRAFT)
            throw new common_1.BadRequestException('Document already sent');
        return this.signerRepo.remove(signer);
    }
    async send(documentId, baseUrl) {
        const doc = await this.findById(documentId);
        if (doc.status !== sign_document_entity_1.DocStatus.DRAFT)
            throw new common_1.BadRequestException('Already sent');
        if (doc.signers.length === 0)
            throw new common_1.BadRequestException('No signers added');
        const sorted = [...doc.signers].sort((a, b) => a.signOrder - b.signOrder);
        doc.status = sign_document_entity_1.DocStatus.SENT;
        await this.docRepo.save(doc);
        for (const [i, signer] of sorted.entries()) {
            const link = `${baseUrl}/sign/${signer.token}`;
            const orderInfo = sorted.length > 1 ? `<p style="color:#9ca3af;font-size:13px;margin:0 0 15px;">Eres el firmante #${i + 1} de ${sorted.length}</p>` : '';
            const html = `
        <div style="font-family:Arial;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
          <div style="background:#006d70;padding:28px 32px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">Spectra · Firma Digital</h1>
          </div>
          <div style="padding:32px;">
            <p style="color:#374151;font-size:15px;">Hola <strong>${signer.name}</strong>,</p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;">
              Has sido invitado a firmar el documento <strong>"${doc.title}"</strong>.
            </p>
            ${orderInfo}
            <a href="${link}" style="display:block;background:#006d70;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-size:15px;font-weight:600;margin:20px 0;">
              Ir a firmar
            </a>
            <p style="color:#9ca3af;font-size:12px;">Este enlace es personal e intransferible.</p>
          </div>
        </div>`;
            await this.emailService.sendRaw(signer.email, `Firma digital: ${doc.title}`, html);
        }
    }
    async getByToken(token) {
        const signer = await this.signerRepo.findOne({ where: { token }, relations: ['document', 'document.signers'] });
        if (!signer)
            throw new common_1.NotFoundException('Invalid token');
        return signer;
    }
    async sign(token, signatureDataUrl, ipAddress, x, y) {
        const signer = await this.signerRepo.findOne({ where: { token }, relations: ['document', 'document.signers'] });
        if (!signer)
            throw new common_1.NotFoundException('Invalid token');
        if (signer.hasSigned)
            throw new common_1.BadRequestException('Already signed');
        const sorted = [...signer.document.signers].sort((a, b) => a.signOrder - b.signOrder);
        const myIndex = sorted.findIndex((s) => s.id === signer.id);
        if (myIndex > 0 && !sorted[myIndex - 1].hasSigned) {
            throw new common_1.BadRequestException('Aún no es tu turno. Espera a que el firmante anterior firme primero.');
        }
        signer.hasSigned = true;
        signer.signedAt = new Date();
        signer.signatureDataUrl = signatureDataUrl;
        signer.ipAddress = ipAddress;
        if (x !== undefined)
            signer.signatureX = x;
        if (y !== undefined)
            signer.signatureY = y;
        await this.signerRepo.save(signer);
        const doc = signer.document;
        const allSigned = doc.signers.every((s) => s.hasSigned);
        if (allSigned) {
            doc.status = sign_document_entity_1.DocStatus.COMPLETED;
            doc.certificateData = this.generateCertificate(doc);
            await this.docRepo.save(doc);
            for (const s of doc.signers) {
                const html = `
          <div style="font-family:Arial;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="background:#006d70;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;">Documento firmado</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#374151;font-size:15px;">Hola <strong>${s.name}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                El documento <strong>"${doc.title}"</strong> ha sido firmado por todos los participantes.
              </p>
              <p style="color:#9ca3af;font-size:12px;">Ya puedes descargar el certificado desde la plataforma.</p>
            </div>
          </div>`;
                await this.emailService.sendRaw(s.email, `Documento firmado: ${doc.title}`, html).catch((err) => this.logger.error(`Failed to send completion email to ${s.email}`, err));
            }
        }
        else {
            const nextSigner = sorted.find((s) => !s.hasSigned);
            if (nextSigner) {
                const baseUrl = process.env.APP_URL || 'http://localhost:5173';
                const link = `${baseUrl}/sign/${nextSigner.token}`;
                const html = `
          <div style="font-family:Arial;max-width:520px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
            <div style="background:#006d70;padding:28px 32px;text-align:center;">
              <h1 style="color:#fff;margin:0;font-size:20px;">Turno de firma</h1>
            </div>
            <div style="padding:32px;">
              <p style="color:#374151;font-size:15px;">Hola <strong>${nextSigner.name}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.6;">
                El firmante anterior ha completado su firma en <strong>"${doc.title}"</strong>. Ahora es tu turno.
              </p>
              <a href="${link}" style="display:block;background:#006d70;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-size:15px;font-weight:600;margin:20px 0;">Ir a firmar</a>
            </div>
          </div>`;
                await this.emailService.sendRaw(nextSigner.email, `Turno de firma: ${doc.title}`, html).catch((err) => this.logger.error(`Failed to send signing email to ${nextSigner.email}`, err));
            }
        }
        return { message: 'Document signed', allSigned };
    }
    async remove(id) {
        const doc = await this.findById(id);
        return this.docRepo.remove(doc);
    }
    generateCertificate(doc) {
        const lines = doc.signers.map((s) => `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${s.name}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${s.email}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${s.role}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${s.signedAt?.toLocaleString('es') || ''}</td>
        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">${s.ipAddress || '—'}</td>
      </tr>`).join('');
        return `<div style="font-family:Arial;padding:40px;">
      <h1 style="color:#006d70;border-bottom:2px solid #006d70;padding-bottom:10px;">Certificado de Finalización</h1>
      <p>Documento: <strong>${doc.title}</strong></p>
      <p>Completado el: ${new Date().toLocaleString('es')}</p>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <thead><tr style="background:#f9fafb;">
          <th style="padding:10px;text-align:left;">Nombre</th>
          <th style="padding:10px;text-align:left;">Email</th>
          <th style="padding:10px;text-align:left;">Rol</th>
          <th style="padding:10px;text-align:left;">Firma</th>
          <th style="padding:10px;text-align:left;">IP</th>
        </tr></thead>
        <tbody>${lines}</tbody>
      </table>
    </div>`;
    }
};
exports.SignaturesService = SignaturesService;
exports.SignaturesService = SignaturesService = SignaturesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(sign_document_entity_1.SignDocument)),
    __param(1, (0, typeorm_1.InjectRepository)(signer_entity_1.Signer)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService])
], SignaturesService);
//# sourceMappingURL=signatures.service.js.map
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');
import { SignDocument, DocStatus } from './sign-document.entity';
import { Signer } from './signer.entity';
import { EmailService } from '../email/email.service';
import { Contract, ContractStatus } from '../contracts/contract.entity';

@Injectable()
export class SignaturesService {
  private readonly logger = new Logger(SignaturesService.name);

  constructor(
    @InjectRepository(SignDocument)
    private docRepo: Repository<SignDocument>,
    @InjectRepository(Signer)
    private signerRepo: Repository<Signer>,
    @InjectRepository(Contract)
    private contractRepo: Repository<Contract>,
    private emailService: EmailService,
  ) {}

  async findAll(ownerUserId?: number, page = 1, limit = 50) {
    const where: any = {};
    if (ownerUserId) where.ownerUserId = ownerUserId;
    const [data, total] = await this.docRepo.findAndCount({
      where,
      relations: ['signers'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findById(id: number) {
    const doc = await this.docRepo.findOne({ where: { id }, relations: ['signers'] });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async create(data: { title: string; description?: string; file: Express.Multer.File; ownerUserId: number }) {
    const doc = this.docRepo.create({
      title: data.title,
      description: data.description,
      filePath: `/uploads/${data.file.filename}`,
      originalName: data.file.originalname,
      mimeType: data.file.mimetype,
      ownerUserId: data.ownerUserId,
      status: DocStatus.DRAFT,
    });
    return this.docRepo.save(doc);
  }

  async addSigner(documentId: number, data: { name: string; email: string; role?: string; signOrder?: number }) {
    const doc = await this.findById(documentId);
    if (doc.status !== DocStatus.DRAFT) throw new BadRequestException('Document already sent');

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

  async removeSigner(signerId: number) {
    const signer = await this.signerRepo.findOne({ where: { id: signerId }, relations: ['document'] });
    if (!signer) throw new NotFoundException('Signer not found');
    if (signer.document.status !== DocStatus.DRAFT) throw new BadRequestException('Document already sent');
    return this.signerRepo.remove(signer);
  }

  async send(documentId: number, baseUrl: string) {
    const doc = await this.findById(documentId);
    if (doc.status !== DocStatus.DRAFT) throw new BadRequestException('Already sent');
    if (doc.signers.length === 0) throw new BadRequestException('No signers added');

    const sorted = [...doc.signers].sort((a, b) => a.signOrder - b.signOrder);
    doc.status = DocStatus.SENT;
    await this.docRepo.save(doc);
    await this.syncContractDocumentState(documentId);

    const firstSigner = sorted[0];
    if (firstSigner) {
      await this.sendSignatureInvitation(doc, firstSigner, sorted.length, baseUrl, 0);
    }
  }

  async getByToken(token: string) {
    const signer = await this.signerRepo.findOne({ where: { token }, relations: ['document', 'document.signers'] });
    if (!signer) throw new NotFoundException('Invalid token');
    return signer;
  }

  async sign(token: string, signatureDataUrl: string, ipAddress: string, x?: number, y?: number) {
    const signer = await this.signerRepo.findOne({ where: { token }, relations: ['document', 'document.signers'] });
    if (!signer) throw new NotFoundException('Invalid token');
    if (signer.hasSigned) throw new BadRequestException('Already signed');

    const sorted = [...signer.document.signers].sort((a, b) => a.signOrder - b.signOrder);
    const myIndex = sorted.findIndex((s) => s.id === signer.id);
    if (myIndex > 0 && !sorted[myIndex - 1].hasSigned) {
      throw new BadRequestException('Aún no es tu turno. Espera a que el firmante anterior firme primero.');
    }

    signer.hasSigned = true;
    signer.signedAt = new Date();
    signer.signatureDataUrl = signatureDataUrl;
    signer.ipAddress = ipAddress;
    if (x !== undefined) signer.signatureX = x;
    if (y !== undefined) signer.signatureY = y;
    await this.signerRepo.save(signer);

    const doc = await this.findById(signer.documentId);
    const orderedSigners = [...doc.signers].sort((a, b) => a.signOrder - b.signOrder);
    const allSigned = orderedSigners.every((s) => s.hasSigned);

    if (allSigned) {
      doc.status = DocStatus.COMPLETED;
      doc.certificateData = this.generateCertificate(doc);
      await this.docRepo.save(doc);
    }

    await this.syncContractDocumentState(doc.id);

    if (allSigned) {
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
    } else {
      const nextSigner = orderedSigners.find((s) => !s.hasSigned);
      if (nextSigner) {
        const baseUrl = process.env.APP_URL || 'http://localhost:5173';
        const nextIndex = orderedSigners.findIndex((s) => s.id === nextSigner.id);
        await this.sendTurnEmail(doc, nextSigner, orderedSigners.length, baseUrl, nextIndex);
      }
    }

    return { message: 'Document signed', allSigned };
  }

  async remove(id: number) {
    const doc = await this.findById(id);
    return this.docRepo.remove(doc);
  }

  private async syncContractDocumentState(documentId: number) {
    const contract = await this.contractRepo.findOne({
      where: { signDocumentId: documentId },
      relations: ['signDocument', 'signDocument.signers'],
    });
    if (!contract?.signDocument) return;

    await this.renderContractPdf(contract, contract.signDocument.signers || []);

    const orderedSigners = [...(contract.signDocument.signers || [])].sort((a, b) => a.signOrder - b.signOrder);
    const allSigned = orderedSigners.length > 0 && orderedSigners.every((s) => s.hasSigned);
    contract.status = allSigned ? ContractStatus.SIGNED : ContractStatus.SENT;
    contract.signedAt = allSigned ? new Date() : null as any;
    await this.contractRepo.save(contract);
  }

  private async sendSignatureInvitation(doc: SignDocument, signer: Signer, totalSigners: number, baseUrl: string, signerIndex: number) {
    const link = `${baseUrl}/sign/${signer.token}`;
    const orderInfo = totalSigners > 1 ? `<p style="color:#9ca3af;font-size:13px;margin:0 0 15px;">Eres el firmante #${signerIndex + 1} de ${totalSigners}</p>` : '';
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

  private async sendTurnEmail(doc: SignDocument, nextSigner: Signer, totalSigners: number, baseUrl: string, signerIndex: number) {
    const link = `${baseUrl}/sign/${nextSigner.token}`;
    const orderInfo = totalSigners > 1 ? `<p style="color:#9ca3af;font-size:13px;margin:0 0 15px;">Eres el firmante #${signerIndex + 1} de ${totalSigners}</p>` : '';
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
          ${orderInfo}
          <a href="${link}" style="display:block;background:#006d70;color:#fff;text-decoration:none;text-align:center;padding:14px;border-radius:10px;font-size:15px;font-weight:600;margin:20px 0;">Ir a firmar</a>
        </div>
      </div>`;
    await this.emailService.sendRaw(nextSigner.email, `Turno de firma: ${doc.title}`, html).catch((err) => this.logger.error(`Failed to send signing email to ${nextSigner.email}`, err));
  }

  private resolveStoragePath(relativePath: string) {
    return path.join(process.cwd(), relativePath.replace(/^\/+/, '').replace(/\//g, path.sep));
  }

  private getSignatureBuffer(signatureDataUrl?: string) {
    if (!signatureDataUrl) return null;
    const match = signatureDataUrl.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    if (!match) return null;
    return Buffer.from(match[1], 'base64');
  }

  private async renderContractPdf(contract: Contract, signers: Signer[]) {
    if (!contract.signDocument?.filePath) return;

    const outputPath = this.resolveStoragePath(contract.signDocument.filePath);
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const writeStream = fs.createWriteStream(outputPath);
    const doc = new PDFDocument({ margin: 70, size: 'A4' });
    doc.pipe(writeStream);

    const ml = 70;
    const pw = 455;
    const pageH = 842;
    const black = '#1a1a1a';
    const gray = '#666666';
    const lightGray = '#aaaaaa';

    const drawRule = (y: number, opts?: { width?: number; dash?: number[] }) => {
      const w = opts?.width || pw;
      if (opts?.dash) doc.dash(opts.dash[0], { space: opts.dash[1] });
      doc.moveTo(ml, y).lineTo(ml + w, y).lineWidth(0.4).strokeColor('#000').stroke();
      if (opts?.dash) doc.undash();
    };

    const drawFooter = (pg: number) => {
      doc.fontSize(7).font('Helvetica').fillColor(lightGray);
      doc.text(`— ${pg} —`, ml, pageH - 45, { width: pw, align: 'center' });
    };

    let pageCount = 1;

    drawRule(80, { dash: [1, 3] });
    doc.y = 110;
    doc.fontSize(22).font('Helvetica-Bold').fillColor(black)
      .text(contract.title.toUpperCase(), ml, doc.y, { width: pw, align: 'center', lineGap: 4 });
    doc.moveDown(0.8);

    drawRule(doc.y, { width: 60 });
    doc.moveDown(0.8);

    const contractNumber = `N.° ${String(contract.id).padStart(6, '0')}`;
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text(contractNumber, ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.3);

    const dateStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.fontSize(9).font('Helvetica').fillColor(gray)
      .text(dateStr, ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(2);
    drawRule(doc.y);
    doc.moveDown(0.8);

    doc.fontSize(8).font('Helvetica-Bold').fillColor(gray)
      .text('ENTRE', ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.8);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(black)
      .text(contract.tenantName || `Usuario ID ${contract.tenantUserId}`, ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica').fillColor(gray)
      .text('(en adelante, "EL CONTRATANTE")', ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(1);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(gray)
      .text('Y', ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(1);

    doc.fontSize(11).font('Helvetica-Bold').fillColor(black)
      .text(contract.freelancerName || `Usuario ID ${contract.freelancerUserId}`, ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8).font('Helvetica').fillColor(gray)
      .text('(en adelante, "EL CONTRATISTA")', ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(1.5);
    drawRule(doc.y);
    doc.moveDown(1.5);

    doc.fontSize(9).font('Helvetica-Oblique').fillColor(gray)
      .text('En virtud del presente contrato, las partes acuerdan lo siguiente:', ml, doc.y, { width: pw, align: 'center' });

    doc.moveDown(2);
    drawRule(doc.y, { dash: [1, 3] });

    doc.addPage();
    pageCount = 2;
    drawFooter(pageCount);

    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const text = stripHtml(contract.content);
    const lines = text.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (doc.y > pageH - 100) {
        doc.addPage();
        pageCount++;
        drawFooter(pageCount);
      }

      if (trimmed.match(/^CONTRATO|^ACUERDO/) || trimmed.match(/^[A-ZÁÉÍÓÚÑ\s]{10,}$/)) {
        doc.moveDown(0.8);
        doc.fontSize(12).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'center', lineGap: 2 });
        doc.moveDown(0.8);
      } else if (trimmed.match(/^(PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|SÉPTIMA|OCTAVA|NOVENA|DÉCIMA|CLÁUSULAS?):/i)) {
        doc.moveDown(0.6);
        doc.fontSize(10).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, lineGap: 1 });
        doc.moveDown(0.3);
      } else if (trimmed.match(/^(CONSIDERANDO|PARTE )/i)) {
        doc.moveDown(0.4);
        doc.fontSize(9).font('Helvetica-Bold').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw });
        doc.moveDown(0.2);
      } else if (trimmed.match(/^_{3,}/) || trimmed.match(/^─{3,}/)) {
        doc.moveDown(0.6);
      } else if (trimmed === '') {
        doc.moveDown(0.2);
      } else {
        doc.fontSize(10).font('Helvetica').fillColor(black);
        doc.text(trimmed, ml, doc.y, { width: pw, align: 'justify', lineGap: 3 });
        doc.moveDown(0.3);
      }
    }

    if (doc.y > pageH - 200) {
      doc.addPage();
      pageCount++;
      drawFooter(pageCount);
    }

    doc.moveDown(3);
    drawRule(doc.y);
    doc.moveDown(1);

    doc.fontSize(10).font('Helvetica-Bold').fillColor(black)
      .text('FIRMAS', ml, doc.y, { width: pw, align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(8).font('Helvetica-Oblique').fillColor(gray)
      .text('En señal de conformidad, las partes firman el presente contrato', ml, doc.y, { width: pw, align: 'center' });
    doc.text('en dos ejemplares del mismo tenor y a un solo efecto.', ml, doc.y + 2, { width: pw, align: 'center' });

    doc.moveDown(2.5);

    const sigW = 160;
    const gap = 50;
    const leftX = ml + (pw - sigW * 2 - gap) / 2;
    const rightX = leftX + sigW + gap;
    const sigY = doc.y;
    const orderedSigners = [...signers].sort((a, b) => a.signOrder - b.signOrder);

    const slots = [
      { x: leftX, name: contract.tenantName || 'EL CONTRATANTE', label: 'EL CONTRATANTE', signer: orderedSigners[0] },
      { x: rightX, name: contract.freelancerName || 'EL CONTRATISTA', label: 'EL CONTRATISTA', signer: orderedSigners[1] },
    ];

    for (const slot of slots) {
      doc.moveTo(slot.x, sigY).lineTo(slot.x + sigW, sigY).lineWidth(0.8).strokeColor(black).stroke();
      const signatureBuffer = this.getSignatureBuffer(slot.signer?.signatureDataUrl);
      if (signatureBuffer) {
        try {
          doc.image(signatureBuffer, slot.x + 10, sigY - 48, { fit: [sigW - 20, 40], align: 'center', valign: 'center' });
        } catch (error) {
          this.logger.warn(`Could not render signature for signer ${slot.signer?.id}: ${(error as Error).message}`);
        }
      }
      doc.fontSize(9).font('Helvetica-Bold').fillColor(black)
        .text(slot.name, slot.x, sigY + 22, { width: sigW, align: 'center' });
      doc.fontSize(7).font('Helvetica').fillColor(gray)
        .text(slot.label, slot.x, sigY + 36, { width: sigW, align: 'center' });
      if (slot.signer?.signedAt) {
        doc.fontSize(6.5).font('Helvetica').fillColor(lightGray)
          .text(`Firmado: ${new Date(slot.signer.signedAt).toLocaleString('es-ES')}`, slot.x, sigY + 50, { width: sigW, align: 'center' });
      }
    }

    doc.moveDown(5);
    drawRule(doc.y, { dash: [1, 3] });
    doc.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });
  }

  private generateCertificate(doc: SignDocument): string {
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
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { SignDocument, DocStatus } from './sign-document.entity';
import { Signer } from './signer.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class SignaturesService {
  private readonly logger = new Logger(SignaturesService.name);

  constructor(
    @InjectRepository(SignDocument)
    private docRepo: Repository<SignDocument>,
    @InjectRepository(Signer)
    private signerRepo: Repository<Signer>,
    private emailService: EmailService,
  ) {}

  async findAll(ownerUserId?: number) {
    const where: any = {};
    if (ownerUserId) where.ownerUserId = ownerUserId;
    return this.docRepo.find({ where, relations: ['signers'], order: { createdAt: 'DESC' }, take: 200 });
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

    const doc = signer.document;
    const allSigned = doc.signers.every((s) => s.hasSigned);
    if (allSigned) {
      doc.status = DocStatus.COMPLETED;
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
    } else {
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

  async remove(id: number) {
    const doc = await this.findById(id);
    return this.docRepo.remove(doc);
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

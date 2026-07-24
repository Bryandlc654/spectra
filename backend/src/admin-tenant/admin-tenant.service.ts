import { Injectable, UnauthorizedException, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
const PDFDocument = require('pdfkit');
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '../users/user.entity';
import { Contract, ContractStatus } from '../contracts/contract.entity';
import { ContractTemplate } from '../contracts/contract-template.entity';
import { KycRequest, KycStatus } from '../kyc/kyc-request.entity';
import { KycDocument } from '../kyc/kyc-document.entity';
import { KybRequest } from '../kyb/kyb-request.entity';
import { KybDocument } from '../kyb/kyb-document.entity';
import { Area } from '../areas/area.entity';
import { Tenant } from '../tenants/tenant.entity';
import { EmailService } from '../email/email.service';
import { KybService } from '../kyb/kyb.service';
import { SignaturesService } from '../signatures/signatures.service';

@Injectable()
export class AdminTenantService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Contract) private contractsRepo: Repository<Contract>,
    @InjectRepository(ContractTemplate) private templatesRepo: Repository<ContractTemplate>,
    @InjectRepository(KycRequest) private kycRepo: Repository<KycRequest>,
    @InjectRepository(KycDocument) private kycDocRepo: Repository<KycDocument>,
    @InjectRepository(Area) private areasRepo: Repository<Area>,
    @InjectRepository(Tenant) private tenantsRepo: Repository<Tenant>,
    private emailService: EmailService,
    private jwtService: JwtService,
    private kybService: KybService,
    private signaturesService: SignaturesService,
  ) {}

  private async getTenantIdForUser(userId: number): Promise<number> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.tenantId) throw new ForbiddenException('User is not assigned to a tenant');
    return user.tenantId;
  }

  async getDashboard(adminId: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const [freelancers, contracts, pendingKyc, recentFreelancers, recentContracts] = await Promise.all([
      this.usersRepo.count({ where: { role: UserRole.FREELANCE, tenantId } }),
      this.contractsRepo.count({ where: { tenantId } }),
      this.kycRepo.count({ where: { status: KycStatus.PENDING } }),
      this.usersRepo.find({ where: { role: UserRole.FREELANCE, tenantId }, order: { createdAt: 'DESC' }, take: 5, relations: ['area'] }),
      this.contractsRepo.find({ where: { tenantId }, order: { createdAt: 'DESC' }, take: 5 }),
    ]);

    const draft = await this.contractsRepo.count({ where: { tenantId, status: ContractStatus.DRAFT } });
    const signed = await this.contractsRepo.count({ where: { tenantId, status: ContractStatus.SIGNED } });
    const sent = await this.contractsRepo.count({ where: { tenantId, status: ContractStatus.SENT } });
    const cancelled = await this.contractsRepo.count({ where: { tenantId, status: ContractStatus.CANCELLED } });

    return {
      stats: { freelancers, contracts, pendingKyc, draft, signed, sent, cancelled },
      recentFreelancers,
      recentContracts,
    };
  }

  // ─── FREELANCER CRUD (scoped to tenant) ───────────────────

  async getFreelancers(adminId: number, page = 1, limit = 50, search?: string) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const qb = this.usersRepo.createQueryBuilder('user')
      .leftJoinAndSelect('user.area', 'area')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('user.role = :role', { role: UserRole.FREELANCE })
      .andWhere('user.tenantId = :tenantId', { tenantId })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search OR user.code LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getFreelancerById(adminId: number, id: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const user = await this.usersRepo.findOne({ where: { id, role: UserRole.FREELANCE }, relations: ['area', 'tenant'] });
    if (!user) throw new NotFoundException('Freelancer not found');
    if (user.tenantId !== tenantId) throw new ForbiddenException('Freelancer not in your tenant');
    return user;
  }

  async createFreelancer(adminId: number, data: {
    name: string; email: string; phone?: string; country?: string; documentId?: string;
    areaId?: number; yearsOfExperience?: number; skills?: string; bio?: string;
  }) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const existing = await this.usersRepo.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const invitationToken = this.jwtService.sign(
      { sub: 0, email: data.email, type: 'admin_invitation' },
      { expiresIn: '7d' },
    );

    let code = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      code = String(Math.floor(100000 + Math.random() * 900000));
      const dup = await this.usersRepo.findOne({ where: { code } });
      if (!dup) break;
    }

    const user = this.usersRepo.create({
      name: data.name,
      email: data.email,
      password: await bcrypt.hash('PENDING', 10),
      code,
      phone: data.phone,
      country: data.country,
      documentId: data.documentId,
      areaId: data.areaId,
      yearsOfExperience: data.yearsOfExperience,
      skills: data.skills,
      bio: data.bio,
      role: UserRole.FREELANCE,
      tenantId,
      invitationToken,
      invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    } as any);

    const saved = await this.usersRepo.save(user) as unknown as User;

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const inviteUrl = `${appUrl}/accept-invitation/${invitationToken}`;
    // Fire and forget email - don't block user creation
    this.emailService.sendInvitation(data.email, data.name, inviteUrl).catch((err) => {
      console.error('Failed to send invitation email:', err.message);
    });

    await this.kycRepo.save(this.kycRepo.create({ userId: saved.id, userType: 'freelance', status: KycStatus.PENDING }));
    return saved;
  }

  async updateFreelancer(adminId: number, id: number, data: {
    name?: string; email?: string; phone?: string; country?: string; documentId?: string;
    areaId?: number; yearsOfExperience?: number; skills?: string; bio?: string; isActive?: boolean;
  }) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const user = await this.usersRepo.findOne({ where: { id, role: UserRole.FREELANCE } });
    if (!user) throw new NotFoundException('Freelancer not found');
    if (user.tenantId !== tenantId) throw new ForbiddenException('Freelancer not in your tenant');
    Object.assign(user, data);
    return this.usersRepo.save(user);
  }

  async toggleFreelancerStatus(adminId: number, id: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const user = await this.usersRepo.findOne({ where: { id, role: UserRole.FREELANCE } });
    if (!user) throw new NotFoundException('Freelancer not found');
    if (user.tenantId !== tenantId) throw new ForbiddenException('Freelancer not in your tenant');
    user.isActive = !user.isActive;
    return this.usersRepo.save(user);
  }

  async deleteFreelancer(adminId: number, id: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const user = await this.usersRepo.findOne({ where: { id, role: UserRole.FREELANCE } });
    if (!user) throw new NotFoundException('Freelancer not found');
    if (user.tenantId !== tenantId) throw new ForbiddenException('Freelancer not in your tenant');
    return this.usersRepo.remove(user);
  }

  // ─── CONTRACTS (scoped to tenant) ────────────────────────

  async getContracts(adminId: number, page = 1, limit = 50, status?: string, search?: string) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const qb = this.contractsRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.template', 'template')
      .leftJoinAndSelect('contract.signDocument', 'signDocument')
      .leftJoinAndSelect('signDocument.signers', 'signers')
      .where('contract.tenantId = :tenantId', { tenantId })
      .orderBy('contract.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('contract.status = :status', { status });
    if (search) {
      qb.andWhere('(contract.title LIKE :search OR contract.freelancerName LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getContractById(adminId: number, id: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const contract = await this.contractsRepo.findOne({ where: { id }, relations: ['template', 'signDocument', 'signDocument.signers'] });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.tenantId !== tenantId) throw new ForbiddenException('Contract not in your tenant');
    return contract;
  }

  async createContract(adminId: number, data: {
    templateId: number; freelancerUserId: number; freelancerName?: string;
    title: string; startDate?: string; endDate?: string; amount?: number;
    customData?: Record<string, string>; firstPaymentDate?: string; paymentFrequency?: number; paymentNotes?: string;
  }) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const admin = await this.usersRepo.findOne({ where: { id: adminId } });
    const tenant = await this.tenantsRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    const freelancer = await this.usersRepo.findOne({ where: { id: data.freelancerUserId, role: UserRole.FREELANCE } });
    if (!freelancer) throw new NotFoundException('Freelancer not found');
    if (freelancer.tenantId !== tenantId) throw new ForbiddenException('Freelancer not in your tenant');

    const template = await this.templatesRepo.findOne({ where: { id: data.templateId } });
    if (!template) throw new NotFoundException('Template not found');

    const placeholders: Record<string, string> = {
      tenant_name: admin?.name || '',
      freelancer_name: freelancer.name || data.freelancerName || '',
      date: new Date().toLocaleDateString('es'),
      start_date: data.startDate || '',
      end_date: data.endDate || '',
      amount: data.amount ? `$${data.amount.toFixed(2)}` : '',
      first_payment_date: data.firstPaymentDate || '',
      payment_frequency: data.paymentFrequency ? (data.paymentFrequency === 1 ? 'Mensual' : 'Quincenal') : '',
      payment_notes: data.paymentNotes || '',
      ...(data.customData || {}),
    };

    let content = template.content;
    for (const [key, value] of Object.entries(placeholders)) {
      content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value || '');
    }

    const contract = this.contractsRepo.create({
      templateId: data.templateId,
      tenantUserId: adminId,
      tenantId,
      tenantName: tenant.name,
      freelancerUserId: data.freelancerUserId,
      freelancerName: freelancer.name,
      title: data.title,
      content,
      startDate: data.startDate,
      endDate: data.endDate,
      amount: data.amount,
      firstPaymentDate: data.firstPaymentDate,
      paymentFrequency: data.paymentFrequency,
      paymentNotes: data.paymentNotes,
      status: ContractStatus.DRAFT,
    });

    const saved = await this.contractsRepo.save(contract);

    // Fire-and-forget email notification
    if (freelancer.email) {
      this.emailService.sendContractCreated(freelancer.email, freelancer.name, data.title, admin?.name || '').catch((err) => {
        console.error('Failed to send contract created email:', err.message);
      });
    }

    return saved;
  }

  async updateContract(adminId: number, id: number, data: { 
    title?: string; startDate?: string; endDate?: string; amount?: number; 
    firstPaymentDate?: string; paymentFrequency?: number; paymentNotes?: string 
  }) {
    const contract = await this.getContractById(adminId, id);
    if (contract.status !== ContractStatus.DRAFT) {
      throw new BadRequestException('Only draft contracts can be edited');
    }
    if (data.title !== undefined) contract.title = data.title;
    if (data.startDate !== undefined) contract.startDate = data.startDate;
    if (data.endDate !== undefined) contract.endDate = data.endDate;
    if (data.amount !== undefined) contract.amount = data.amount;
    if (data.firstPaymentDate !== undefined) contract.firstPaymentDate = data.firstPaymentDate;
    if (data.paymentFrequency !== undefined) contract.paymentFrequency = data.paymentFrequency;
    if (data.paymentNotes !== undefined) contract.paymentNotes = data.paymentNotes;
    return this.contractsRepo.save(contract);
  }

  async updateContractStatus(adminId: number, id: number, status: ContractStatus) {
    const validStatuses = Object.values(ContractStatus);
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(`Invalid status. Allowed: ${validStatuses.join(', ')}`);
    }
    const contract = await this.getContractById(adminId, id);

    if (status === ContractStatus.SIGNED) {
      throw new BadRequestException('Use the digital signature flow to sign contracts');
    }

    contract.status = status;
    const saved = await this.contractsRepo.save(contract);

    // Fire-and-forget email notification
    const freelancer = await this.usersRepo.findOne({ where: { id: contract.freelancerUserId } });
    if (freelancer?.email) {
      this.emailService.sendContractStatusChanged(freelancer.email, freelancer.name || '', contract.title, status, contract.tenantName || '').catch((err) => {
        console.error('Failed to send contract status email:', err.message);
      });
    }

    return saved;
  }

  private async generateContractPdf(contract: Contract): Promise<{ filePath: string; originalName: string }> {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `contract-${contract.id}-${Date.now()}.pdf`;
    const filePath = path.join(uploadDir, filename);
    const writeStream = fs.createWriteStream(filePath);

    const doc = new PDFDocument({ margin: 70, size: 'A4' });
    doc.pipe(writeStream);

    const ml = 70;
    const pw = 450;
    const black = '#1a1a1a';
    const gray = '#666666';
    const lightGray = '#aaaaaa';

    const drawRule = (y: number, opts?: { width?: number; dash?: number[] }) => {
      const w = opts?.width || pw;
      if (opts?.dash) doc.dash(opts.dash[0], { space: opts.dash[1] });
      doc.moveTo(ml, y).lineTo(ml + w, y).lineWidth(0.4).strokeColor('#000').stroke();
      if (opts?.dash) doc.undash();
    };

    // Cover page
    drawRule(80, { dash: [1, 3] });
    doc.y = 110;
    doc.fontSize(22).font('Helvetica-Bold').fillColor(black)
      .text(contract.title.toUpperCase(), ml, doc.y, { width: pw, align: 'center', lineGap: 4 });
    doc.moveDown(0.8);

    const ruleW = 60;
    drawRule(doc.y, { width: ruleW });
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

    // Content
    doc.addPage();
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    const text = stripHtml(contract.content);
    const lines = text.split('\n').filter((l) => l.trim());

    for (const line of lines) {
      const trimmed = line.trim();
      if (doc.y > 700) {
        doc.addPage();
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

    // Signature page
    if (doc.y > 700) doc.addPage();

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

    doc.moveTo(leftX, sigY).lineTo(leftX + sigW, sigY).lineWidth(0.8).strokeColor(black).stroke();
    doc.moveTo(rightX, sigY).lineTo(rightX + sigW, sigY).lineWidth(0.8).strokeColor(black).stroke();

    doc.moveDown(0.8);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(black)
      .text(contract.tenantName || 'EL CONTRATANTE', leftX, doc.y, { width: sigW, align: 'center' });
    doc.text(contract.freelancerName || 'EL CONTRATISTA', rightX, sigY + 22, { width: sigW, align: 'center' });

    doc.moveDown(0.4);
    doc.fontSize(7).font('Helvetica').fillColor(gray)
      .text('EL CONTRATANTE', leftX, doc.y, { width: sigW, align: 'center' });
    doc.text('EL CONTRATISTA', rightX, doc.y - 12, { width: sigW, align: 'center' });

    doc.moveDown(3);
    drawRule(doc.y, { dash: [1, 3] });

    doc.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    return { filePath: `/uploads/${filename}`, originalName: filename };
  }

  async initiateContractSignature(adminId: number, id: number, baseUrl: string) {
    const admin = await this.usersRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('User not found');

    const contract = await this.getContractById(adminId, id);
    if (contract.status === ContractStatus.CANCELLED) {
      throw new BadRequestException('Cancelled contracts cannot be signed');
    }
    if (contract.signDocumentId) {
      const existing = await this.signaturesService.findById(contract.signDocumentId);
      return { signDocument: existing };
    }

    // Generate PDF
    const { filePath, originalName } = await this.generateContractPdf(contract);

    // Create a fake Multer file object for SignaturesService.create (since we generated the file manually)
    const fakeFile = {
      filename: originalName,
      originalname: `Contrato-${contract.id}.pdf`,
      mimetype: 'application/pdf',
      path: filePath,
    } as unknown as Express.Multer.File;

    // Create SignDocument
    const signDoc = await this.signaturesService.create({
      title: `Contrato: ${contract.title}`,
      description: `Contrato entre ${contract.tenantName} y ${contract.freelancerName}`,
      file: fakeFile,
      ownerUserId: adminId,
    });

    // Get freelancer
    const freelancer = await this.usersRepo.findOne({ where: { id: contract.freelancerUserId } });
    if (!freelancer) throw new NotFoundException('Freelancer not found');

    // Add signers: admin first, then freelancer
    await this.signaturesService.addSigner(signDoc.id, {
      name: admin.name,
      email: admin.email,
      role: 'Contratante',
      signOrder: 1,
    });

    await this.signaturesService.addSigner(signDoc.id, {
      name: freelancer.name,
      email: freelancer.email,
      role: 'Contratista',
      signOrder: 2,
    });

    // Update contract with signDocumentId
    contract.signDocumentId = signDoc.id;
    contract.status = ContractStatus.SENT;
    await this.contractsRepo.save(contract);

    // Send the signature requests
    await this.signaturesService.send(signDoc.id, baseUrl);

    // Reload the sign doc with relations to get the signers and their tokens
    const signDocWithSigners = await this.signaturesService.findById(signDoc.id);

    return { signDocument: signDocWithSigners };
  }

  async deleteContract(adminId: number, id: number) {
    const contract = await this.getContractById(adminId, id);
    return this.contractsRepo.remove(contract);
  }

  // ─── KYC (scoped to tenant's freelancers) ────────────────

  async getKycRequests(adminId: number, page = 1, limit = 50, status?: string, search?: string) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const tenantUserIds = (await this.usersRepo.find({ where: { role: UserRole.FREELANCE, tenantId }, select: ['id'] })).map((u) => u.id);
    if (tenantUserIds.length === 0) return { data: [], total: 0, page, limit, totalPages: 0 };

    const qb = this.kycRepo.createQueryBuilder('kyc')
      .leftJoinAndSelect('kyc.documents', 'docs')
      .leftJoinAndSelect('kyc.user', 'user')
      .where('kyc.userId IN (:...ids)', { ids: tenantUserIds })
      .orderBy('kyc.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('kyc.status = :status', { status });
    if (search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async uploadKycDocument(adminId: number, userId: number, type: string, file: Express.Multer.File) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.tenantId !== tenantId) throw new ForbiddenException('User not in your tenant');
    if (!file) throw new NotFoundException('No file provided');

    let kyc = await this.kycRepo.findOne({ where: { userId } });
    if (!kyc) {
      kyc = this.kycRepo.create({ userId, userType: user.role, status: KycStatus.PENDING });
      kyc = await this.kycRepo.save(kyc);
    }

    const doc = this.kycDocRepo.create({
      kycRequestId: kyc.id,
      type,
      originalName: file.originalname,
      filePath: `/uploads/${file.filename}`,
      mimeType: file.mimetype,
    });
    await this.kycDocRepo.save(doc);
    return { message: 'Document uploaded', kycId: kyc.id };
  }

  async updateKycStatus(adminId: number, kycId: number, status: KycStatus, adminNotes?: string) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const kyc = await this.kycRepo.findOne({ where: { id: kycId }, relations: ['user'] });
    if (!kyc) throw new NotFoundException('KYC request not found');
    const user = await this.usersRepo.findOne({ where: { id: kyc.userId } });
    if (!user || user.tenantId !== tenantId) throw new ForbiddenException('KYC not in your tenant');
    kyc.status = status;
    if (adminNotes) kyc.adminNotes = adminNotes;
    const saved = await this.kycRepo.save(kyc);
    if (user.email) {
      this.emailService.sendKycStatusChanged(user.email, user.name, status, adminNotes).catch((err) => {
        console.error('Failed to send KYC status email:', err.message);
      });
    }
    return saved;
  }

  async deleteKycDocument(adminId: number, docId: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const doc = await this.kycDocRepo.findOne({ where: { id: docId }, relations: ['kycRequest'] });
    if (!doc) throw new NotFoundException('Document not found');
    const kyc = await this.kycRepo.findOne({ where: { id: doc.kycRequestId } });
    if (!kyc) throw new NotFoundException('KYC request not found');
    const user = await this.usersRepo.findOne({ where: { id: kyc.userId } });
    if (!user || user.tenantId !== tenantId) throw new ForbiddenException('Document not in your tenant');
    await this.kycDocRepo.remove(doc);
    return { message: 'Document deleted' };
  }

  async getAreas() {
    return this.areasRepo.find({ order: { name: 'ASC' } });
  }

  async getTemplates(adminId: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const qb = this.templatesRepo.createQueryBuilder('template');
    const [data] = await qb
      .where('template.tenantId = :tenantId OR template.tenantId IS NULL', { tenantId })
      .andWhere('template.isActive = true')
      .orderBy('template.name', 'ASC')
      .getManyAndCount();
    return data;
  }

  async createTemplate(adminId: number, data: { name: string; content: string }) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const template = this.templatesRepo.create({ ...data, createdByUserId: adminId, tenantId });
    return this.templatesRepo.save(template);
  }

  async updateTemplate(adminId: number, templateId: number, data: { name?: string; content?: string; isActive?: boolean }) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const template = await this.templatesRepo.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');
    if (template.tenantId !== tenantId) throw new ForbiddenException('You do not own this template');
    Object.assign(template, data);
    return this.templatesRepo.save(template);
  }

  async deleteTemplate(adminId: number, templateId: number) {
    const tenantId = await this.getTenantIdForUser(adminId);
    const template = await this.templatesRepo.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');
    if (template.tenantId !== tenantId) throw new ForbiddenException('You do not own this template');
    return this.templatesRepo.remove(template);
  }

  // ─── PROFILE / SETTINGS ──────────────────────────────────

  async getProfile(adminId: number) {
    const user = await this.usersRepo.findOne({ where: { id: adminId }, relations: ['tenant'] });
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user.id, name: user.name, email: user.email, phone: user.phone,
      role: user.role, createdAt: user.createdAt,
      tenant: user.tenant ? {
        id: user.tenant.id, name: user.tenant.name, businessName: user.tenant.businessName,
        taxId: user.tenant.taxId, country: user.tenant.country, baseCurrency: user.tenant.baseCurrency,
        email: user.tenant.email, phone: user.tenant.phone, address: user.tenant.address,
        status: user.tenant.status,
      } : null,
    };
  }

  async updateProfile(adminId: number, data: { name?: string; phone?: string }) {
    const user = await this.usersRepo.findOne({ where: { id: adminId } });
    if (!user) throw new NotFoundException('User not found');
    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    return this.usersRepo.save(user);
  }

  async changePassword(adminId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersRepo.findOne({ where: { id: adminId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    user.password = await bcrypt.hash(newPassword, 10);
    return this.usersRepo.save(user);
  }

  // ─── KYB (Know Your Business) ──────────────────────────────────

  async getKyb(adminId: number) {
    return this.kybService.getKybRequest(adminId, this.usersRepo);
  }

  async uploadKybDocument(adminId: number, type: string, file: Express.Multer.File) {
    return this.kybService.uploadDocument(adminId, this.usersRepo, type, file);
  }

  async deleteKybDocument(adminId: number, docId: number) {
    return this.kybService.deleteDocument(adminId, this.usersRepo, docId);
  }
}

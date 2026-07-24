import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { KycService } from '../kyc/kyc.service';
import { KybService } from '../kyb/kyb.service';
import { KybStatus } from '../kyb/kyb-request.entity';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private tenantsService: TenantsService,
    private kycService: KycService,
    private kybService: KybService,
    private jwtService: JwtService,
  ) {}

  async getDashboard() {
    const [totalUsers, admins, freelancers, recentUsers] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.ADMIN_TENANT } }),
      this.usersRepository.count({ where: { role: UserRole.FREELANCE } }),
      this.usersRepository
        .createQueryBuilder('user')
        .select(['user.id', 'user.email', 'user.name', 'user.role', 'user.phone', 'user.createdAt', 'user.isActive'])
        .orderBy('user.createdAt', 'DESC')
        .limit(5)
        .getMany(),
    ]);

    return {
      stats: { totalUsers, admins, freelancers },
      recentUsers,
    };
  }

  async getAdminTenants(page = 1, limit = 50, search?: string) {
    const qb = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('user.role = :role', { role: UserRole.ADMIN_TENANT })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    const safe = data.map(({ password, invitationToken, invitationExpires, ...rest }: any) => rest);
    return { data: safe, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createAdminTenant(data: { name: string; email: string; phone?: string; tenantId?: number }) {
    const existing = await this.usersRepository.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const invitationToken = this.jwtService.sign(
      { sub: 0, email: data.email, type: 'admin_invitation' },
      { expiresIn: '7d' },
    );
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = this.usersRepository.create({
      name: data.name,
      email: data.email,
      password: await bcrypt.hash('PENDING', 10),
      phone: data.phone,
      role: UserRole.ADMIN_TENANT,
      tenantId: data.tenantId ?? undefined,
      invitationToken,
      invitationExpires,
    } as any);
    const saved: User = await this.usersRepository.save(user) as unknown as User;

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const inviteUrl = `${appUrl}/accept-invitation/${invitationToken}`;

    let tenantName: string | undefined;
    if (data.tenantId) {
      try {
        const tenant = await this.tenantsService.findById(data.tenantId);
        tenantName = tenant.businessName;
      } catch {}
    }

    await this.emailService.sendInvitation(data.email, data.name, inviteUrl, tenantName).catch((err) => {
      console.error('Failed to send invitation email:', err.message);
    });
    await this.kycService.create(saved.id, 'admin_tenant');
    return saved;
  }

  async updateAdminTenant(id: number, data: { name?: string; email?: string; phone?: string; tenantId?: number }) {
    const user = await this.usersRepository.findOne({ where: { id, role: UserRole.ADMIN_TENANT } });
    if (!user) throw new NotFoundException('Admin tenant not found');
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async deleteAdminTenant(id: number) {
    const user = await this.usersRepository.findOne({ where: { id, role: UserRole.ADMIN_TENANT } });
    if (!user) throw new NotFoundException('Admin tenant not found');
    return this.usersRepository.remove(user);
  }

  async getFreelancers(page = 1, limit = 50, search?: string) {
    const qb = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.area', 'area')
      .where('user.role = :role', { role: UserRole.FREELANCE })
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(user.name LIKE :search OR user.email LIKE :search OR user.code LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    const safe = data.map(({ password, invitationToken, invitationExpires, ...rest }: any) => rest);
    return { data: safe, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createFreelancer(data: { name: string; email: string; phone?: string; country?: string; documentId?: string; areaId?: number; yearsOfExperience?: number; skills?: string; bio?: string; tenantId?: number }) {
    const existing = await this.usersRepository.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already in use');

    const invitationToken = this.jwtService.sign(
      { sub: 0, email: data.email, type: 'admin_invitation' },
      { expiresIn: '7d' },
    );
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    let code = '';
    for (let attempt = 0; attempt < 10; attempt++) {
      code = String(Math.floor(100000 + Math.random() * 900000));
      const dup = await this.usersRepository.findOne({ where: { code } });
      if (!dup) break;
    }
    const user = this.usersRepository.create({
      name: data.name, email: data.email, password: await bcrypt.hash('PENDING', 10), code,
      phone: data.phone, country: data.country, documentId: data.documentId,
      areaId: data.areaId, yearsOfExperience: data.yearsOfExperience,
      skills: data.skills, bio: data.bio,
      role: UserRole.FREELANCE,
      tenantId: data.tenantId ?? undefined,
      invitationToken,
      invitationExpires,
    } as any);
    const saved = await this.usersRepository.save(user) as unknown as User;

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    const inviteUrl = `${appUrl}/accept-invitation/${invitationToken}`;

    await this.emailService.sendInvitation(data.email, data.name, inviteUrl).catch((err) => {
      console.error('Failed to send invitation email:', err.message);
    });
    await this.kycService.create(saved.id, 'freelance');
    return saved;
  }

  async updateFreelancer(id: number, data: { name?: string; email?: string; password?: string; phone?: string; country?: string; documentId?: string; areaId?: number; yearsOfExperience?: number; skills?: string; bio?: string; tenantId?: number }) {
    const user = await this.usersRepository.findOne({ where: { id, role: UserRole.FREELANCE } });
    if (!user) throw new NotFoundException('Freelancer not found');
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async deleteFreelancer(id: number) {
    const user = await this.usersRepository.findOne({ where: { id, role: UserRole.FREELANCE } });
    if (!user) throw new NotFoundException('Freelancer not found');
    return this.usersRepository.remove(user);
  }

  // ─── KYB (Know Your Business) ──────────────────────────────────

  async getKybRequests(page?: number, limit?: number, status?: string, search?: string) {
    return this.kybService.getAllKybRequests(page || 1, limit || 50, status, search);
  }

  async getKybRequestById(id: number) {
    return this.kybService.getKybRequestById(id);
  }

  async updateKybStatus(id: number, status: KybStatus, adminNotes?: string) {
    return this.kybService.updateKybStatus(id, status, adminNotes);
  }
}

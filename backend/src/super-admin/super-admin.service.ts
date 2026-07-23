import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { KycService } from '../kyc/kyc.service';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private emailService: EmailService,
    private tenantsService: TenantsService,
    private kycService: KycService,
    private jwtService: JwtService,
  ) {}

  async getDashboard() {
    const [totalUsers, admins, freelancers, recentUsers] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { role: UserRole.ADMIN_TENANT } }),
      this.usersRepository.count({ where: { role: UserRole.FREELANCE } }),
      this.usersRepository.find({ order: { createdAt: 'DESC' }, take: 5 }),
    ]);

    return {
      stats: { totalUsers, admins, freelancers },
      recentUsers,
    };
  }

  async getAdminTenants(page = 1, limit = 50) {
    const [data, total] = await this.usersRepository.findAndCount({
      where: { role: UserRole.ADMIN_TENANT },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    await this.emailService.sendInvitation(data.email, data.name, inviteUrl, tenantName);
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

  async getFreelancers(page = 1, limit = 50) {
    const [data, total] = await this.usersRepository.findAndCount({
      where: { role: UserRole.FREELANCE },
      relations: ['tenant', 'area'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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

    await this.emailService.sendInvitation(data.email, data.name, inviteUrl);
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
}

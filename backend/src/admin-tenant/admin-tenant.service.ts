import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class AdminTenantService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getDashboard(adminId: number) {
    const admin = await this.usersRepository.findOne({ where: { id: adminId } });
    if (!admin) throw new UnauthorizedException('Admin not found');

    const freelancers = await this.usersRepository.count({ where: { role: UserRole.FREELANCE } });
    const recentFreelancers = await this.usersRepository.find({
      where: { role: UserRole.FREELANCE },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      admin,
      stats: { freelancers },
      recentFreelancers,
    };
  }
}

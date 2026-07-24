import { Injectable, UnauthorizedException, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/user.entity';
import { Contract, ContractStatus } from '../contracts/contract.entity';
import { KycRequest, KycStatus } from '../kyc/kyc-request.entity';
import { KycDocument } from '../kyc/kyc-document.entity';
import { Area } from '../areas/area.entity';

@Injectable()
export class FreelanceService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Contract) private contractsRepo: Repository<Contract>,
    @InjectRepository(KycRequest) private kycRepo: Repository<KycRequest>,
    @InjectRepository(KycDocument) private kycDocRepo: Repository<KycDocument>,
    @InjectRepository(Area) private areasRepo: Repository<Area>,
  ) {}

  async getProfile(userId: number) {
    const user = await this.usersRepo.findOne({ where: { id: userId }, relations: ['area', 'tenant'] });
    if (!user) throw new UnauthorizedException('User not found');
    return { profile: user };
  }

  async updateProfile(userId: number, data: {
    name?: string; phone?: string; country?: string; documentId?: string; areaId?: number;
    yearsOfExperience?: number; skills?: string; bio?: string;
  }) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    if (data.name !== undefined) user.name = data.name;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.country !== undefined) user.country = data.country;
    if (data.documentId !== undefined) user.documentId = data.documentId;
    if (data.areaId !== undefined) user.areaId = data.areaId;
    if (data.yearsOfExperience !== undefined) user.yearsOfExperience = data.yearsOfExperience;
    if (data.skills !== undefined) user.skills = data.skills;
    if (data.bio !== undefined) user.bio = data.bio;
    const saved = await this.usersRepo.save(user);
    const { password, ...result } = saved as any;
    return { profile: result };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect');
    user.password = await bcrypt.hash(newPassword, 10);
    return this.usersRepo.save(user);
  }

  async getContracts(userId: number, page = 1, limit = 50, search?: string) {
    const qb = this.contractsRepo.createQueryBuilder('contract')
      .leftJoinAndSelect('contract.template', 'template')
      .where('contract.freelancerUserId = :userId', { userId })
      .orderBy('contract.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      qb.andWhere('(contract.title LIKE :search OR contract.tenantName LIKE :search)', { search: `%${search}%` });
    }

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getContractById(userId: number, id: number) {
    const contract = await this.contractsRepo.findOne({ where: { id }, relations: ['template'] });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.freelancerUserId !== userId) throw new NotFoundException('Contract not found');
    return contract;
  }

  async signContract(userId: number, id: number) {
    const contract = await this.getContractById(userId, id);
    if (contract.status !== ContractStatus.SENT) {
      throw new BadRequestException('You can only sign sent contracts');
    }
    contract.status = ContractStatus.SIGNED;
    contract.signedAt = new Date();
    return this.contractsRepo.save(contract);
  }

  async getKycStatus(userId: number) {
    const kyc = await this.kycRepo.findOne({ where: { userId }, relations: ['documents'], order: { createdAt: 'DESC' } });
    return { kyc: kyc || null };
  }

  async uploadKycDocument(userId: number, type: string, file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No file provided');

    let kyc = await this.kycRepo.findOne({ where: { userId } });
    if (!kyc) {
      kyc = this.kycRepo.create({ userId, userType: 'freelance', status: KycStatus.PENDING });
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

  async deleteKycDocument(userId: number, docId: number) {
    const doc = await this.kycDocRepo.findOne({ where: { id: docId }, relations: ['kycRequest'] });
    if (!doc) throw new NotFoundException('Document not found');
    const kyc = await this.kycRepo.findOne({ where: { id: doc.kycRequestId } });
    if (!kyc) throw new NotFoundException('KYC request not found');
    if (kyc.userId !== userId) throw new ForbiddenException('Document does not belong to you');
    await this.kycDocRepo.remove(doc);
    return { message: 'Document deleted' };
  }

  async getAreas() {
    return this.areasRepo.find({ order: { name: 'ASC' } });
  }
}

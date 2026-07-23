import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { EmailService } from '../email/email.service';
import { TenantsService } from '../tenants/tenants.service';
import { KycService } from '../kyc/kyc.service';
export declare class SuperAdminService {
    private usersRepository;
    private emailService;
    private tenantsService;
    private kycService;
    constructor(usersRepository: Repository<User>, emailService: EmailService, tenantsService: TenantsService, kycService: KycService);
    getDashboard(): Promise<{
        stats: {
            totalUsers: number;
            admins: number;
            freelancers: number;
        };
        recentUsers: User[];
    }>;
    getAdminTenants(): Promise<User[]>;
    createAdminTenant(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        tenantId?: number;
    }): Promise<User>;
    updateAdminTenant(id: number, data: {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
        tenantId?: number;
    }): Promise<User>;
    deleteAdminTenant(id: number): Promise<User>;
    getFreelancers(): Promise<User[]>;
    createFreelancer(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        country?: string;
        documentId?: string;
        areaId?: number;
        yearsOfExperience?: number;
        skills?: string;
        bio?: string;
        tenantId?: number;
    }): Promise<User>;
    updateFreelancer(id: number, data: {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
        country?: string;
        documentId?: string;
        areaId?: number;
        yearsOfExperience?: number;
        skills?: string;
        bio?: string;
        tenantId?: number;
    }): Promise<User>;
    deleteFreelancer(id: number): Promise<User>;
}

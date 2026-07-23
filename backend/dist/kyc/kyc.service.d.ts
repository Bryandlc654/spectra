import { Repository } from 'typeorm';
import { KycRequest } from './kyc-request.entity';
import { KycDocument } from './kyc-document.entity';
export declare class KycService {
    private repo;
    private docRepo;
    constructor(repo: Repository<KycRequest>, docRepo: Repository<KycDocument>);
    findAll(page?: number, limit?: number, status?: string): Promise<{
        data: KycRequest[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<KycRequest>;
    findByUserId(userId: number): Promise<KycRequest | null>;
    create(userId: number, userType: string): Promise<KycRequest>;
    addDocument(kycRequestId: number, type: string, file: Express.Multer.File): Promise<KycDocument>;
    approve(id: number): Promise<KycRequest>;
    reject(id: number, adminNotes: string): Promise<KycRequest>;
    getStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    }>;
}

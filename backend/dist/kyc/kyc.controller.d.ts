import { KycService } from './kyc.service';
import { RejectKycDto } from './dto/reject-kyc.dto';
export declare class KycController {
    private service;
    constructor(service: KycService);
    findAll(page?: string, limit?: string, status?: string): Promise<{
        data: import("./kyc-request.entity").KycRequest[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getStats(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    }>;
    findOne(id: string): Promise<import("./kyc-request.entity").KycRequest>;
    upload(userId: number, userType: string, body: {
        type?: string;
    }, file: Express.Multer.File): Promise<{
        message: string;
        kycId: number;
    }>;
    approve(id: string): Promise<import("./kyc-request.entity").KycRequest>;
    reject(id: string, dto: RejectKycDto): Promise<import("./kyc-request.entity").KycRequest>;
    remove(id: string): Promise<import("./kyc-request.entity").KycRequest>;
}

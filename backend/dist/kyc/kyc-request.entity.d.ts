import { KycDocument } from './kyc-document.entity';
export declare enum KycStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class KycRequest {
    id: number;
    userId: number;
    userType: string;
    status: KycStatus;
    adminNotes: string;
    documents: KycDocument[];
    createdAt: Date;
    updatedAt: Date;
}

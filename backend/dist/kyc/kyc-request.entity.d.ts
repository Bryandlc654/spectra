import { KycDocument } from './kyc-document.entity';
import { User } from '../users/user.entity';
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
    user: User;
    createdAt: Date;
    updatedAt: Date;
}

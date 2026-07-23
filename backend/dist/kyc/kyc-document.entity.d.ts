import { KycRequest } from './kyc-request.entity';
export declare class KycDocument {
    id: number;
    type: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    kycRequest: KycRequest;
    kycRequestId: number;
    createdAt: Date;
}

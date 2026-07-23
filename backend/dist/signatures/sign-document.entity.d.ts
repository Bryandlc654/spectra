import { Signer } from './signer.entity';
export declare enum DocStatus {
    DRAFT = "draft",
    SENT = "sent",
    COMPLETED = "completed"
}
export declare class SignDocument {
    id: number;
    title: string;
    description: string;
    filePath: string;
    originalName: string;
    mimeType: string;
    ownerUserId: number;
    status: DocStatus;
    signers: Signer[];
    certificateData: string;
    createdAt: Date;
    updatedAt: Date;
}

import { SignDocument } from './sign-document.entity';
export declare class Signer {
    id: number;
    document: SignDocument;
    documentId: number;
    name: string;
    email: string;
    role: string;
    signOrder: number;
    hasSigned: boolean;
    signedAt: Date;
    ipAddress: string;
    signatureDataUrl: string;
    signatureX: number;
    signatureY: number;
    signaturePage: number;
    token: string;
    createdAt: Date;
}

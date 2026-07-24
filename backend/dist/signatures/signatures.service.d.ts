import { Repository } from 'typeorm';
import { SignDocument } from './sign-document.entity';
import { Signer } from './signer.entity';
import { EmailService } from '../email/email.service';
export declare class SignaturesService {
    private docRepo;
    private signerRepo;
    private emailService;
    private readonly logger;
    constructor(docRepo: Repository<SignDocument>, signerRepo: Repository<Signer>, emailService: EmailService);
    findAll(ownerUserId?: number): Promise<SignDocument[]>;
    findById(id: number): Promise<SignDocument>;
    create(data: {
        title: string;
        description?: string;
        file: Express.Multer.File;
        ownerUserId: number;
    }): Promise<SignDocument>;
    addSigner(documentId: number, data: {
        name: string;
        email: string;
        role?: string;
        signOrder?: number;
    }): Promise<Signer>;
    removeSigner(signerId: number): Promise<Signer>;
    send(documentId: number, baseUrl: string): Promise<void>;
    getByToken(token: string): Promise<Signer>;
    sign(token: string, signatureDataUrl: string, ipAddress: string, x?: number, y?: number): Promise<{
        message: string;
        allSigned: boolean;
    }>;
    remove(id: number): Promise<SignDocument>;
    private generateCertificate;
}

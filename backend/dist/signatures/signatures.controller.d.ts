import { Response } from 'express';
import { SignaturesService } from './signatures.service';
export declare class SignaturesController {
    private service;
    constructor(service: SignaturesService);
    findAll(req: any): Promise<import("./sign-document.entity").SignDocument[]>;
    findOne(id: string): Promise<import("./sign-document.entity").SignDocument>;
    create(req: any, body: {
        title: string;
        description?: string;
    }, file: Express.Multer.File): Promise<import("./sign-document.entity").SignDocument>;
    addSigner(id: string, body: {
        name: string;
        email: string;
        role?: string;
        signOrder?: number;
    }): Promise<import("./signer.entity").Signer>;
    removeSigner(signerId: string): Promise<import("./signer.entity").Signer>;
    send(req: any, id: string): Promise<void>;
    getByToken(token: string): Promise<import("./signer.entity").Signer>;
    sign(token: string, body: {
        signature: string;
        x?: number;
        y?: number;
    }, req: any): Promise<{
        message: string;
        allSigned: boolean;
    }>;
    remove(id: string): Promise<import("./sign-document.entity").SignDocument>;
    getCertificate(id: string, res: Response): Promise<void>;
}

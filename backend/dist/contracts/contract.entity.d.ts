import { ContractTemplate } from './contract-template.entity';
export declare enum ContractStatus {
    DRAFT = "draft",
    SENT = "sent",
    SIGNED = "signed",
    CANCELLED = "cancelled"
}
export declare class Contract {
    id: number;
    template: ContractTemplate;
    templateId: number;
    tenantUserId: number;
    tenantName: string;
    freelancerUserId: number;
    freelancerName: string;
    title: string;
    content: string;
    status: ContractStatus;
    startDate: string;
    endDate: string;
    amount: number;
    signedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

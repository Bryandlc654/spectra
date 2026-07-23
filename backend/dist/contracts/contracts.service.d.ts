import { Repository } from 'typeorm';
import { Contract, ContractStatus } from './contract.entity';
import { ContractTemplatesService } from './contract-templates.service';
export declare class ContractsService {
    private repo;
    private templatesService;
    constructor(repo: Repository<Contract>, templatesService: ContractTemplatesService);
    findAll(filters?: {
        tenantUserId?: number;
        freelancerUserId?: number;
        status?: string;
    }): Promise<Contract[]>;
    findById(id: number): Promise<Contract>;
    private renderTemplate;
    create(data: {
        templateId: number;
        tenantUserId: number;
        tenantName?: string;
        freelancerUserId: number;
        freelancerName?: string;
        title: string;
        startDate?: string;
        endDate?: string;
        amount?: number;
        customData?: Record<string, string>;
    }): Promise<Contract>;
    updateStatus(id: number, status: ContractStatus): Promise<Contract>;
    remove(id: number): Promise<Contract>;
}

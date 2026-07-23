import { Response } from 'express';
import { ContractTemplatesService } from './contract-templates.service';
import { ContractsService } from './contracts.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
export declare class ContractsController {
    private templatesService;
    private contractsService;
    constructor(templatesService: ContractTemplatesService, contractsService: ContractsService);
    getTemplates(req: any): Promise<import("./contract-template.entity").ContractTemplate[]>;
    getTemplate(id: string): Promise<import("./contract-template.entity").ContractTemplate>;
    createTemplate(req: any, dto: CreateTemplateDto): Promise<import("./contract-template.entity").ContractTemplate>;
    getTemplatePdf(id: string, res: Response): Promise<void>;
    updateTemplate(id: string, dto: UpdateTemplateDto): Promise<import("./contract-template.entity").ContractTemplate>;
    deleteTemplate(id: string): Promise<import("./contract-template.entity").ContractTemplate>;
    findAll(req: any): Promise<import("./contract.entity").Contract[]>;
    findOne(id: string): Promise<import("./contract.entity").Contract>;
    create(req: any, body: any): Promise<import("./contract.entity").Contract>;
    updateStatus(id: string, body: {
        status: string;
    }): Promise<import("./contract.entity").Contract>;
    getPdf(id: string, res: Response): Promise<void>;
    remove(id: string): Promise<import("./contract.entity").Contract>;
}

import { Repository } from 'typeorm';
import { ContractTemplate } from './contract-template.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
export declare class ContractTemplatesService {
    private repo;
    constructor(repo: Repository<ContractTemplate>);
    findAll(userId?: number): Promise<ContractTemplate[]>;
    findById(id: number): Promise<ContractTemplate>;
    create(dto: CreateTemplateDto, userId?: number): Promise<ContractTemplate>;
    update(id: number, dto: UpdateTemplateDto): Promise<ContractTemplate>;
    remove(id: number): Promise<ContractTemplate>;
}

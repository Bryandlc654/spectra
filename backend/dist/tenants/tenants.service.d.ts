import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
export declare class TenantsService {
    private repo;
    constructor(repo: Repository<Tenant>);
    findAll(): Promise<Tenant[]>;
    findById(id: number): Promise<Tenant>;
    create(dto: CreateTenantDto): Promise<Tenant>;
    update(id: number, dto: UpdateTenantDto): Promise<Tenant>;
    remove(id: number): Promise<Tenant>;
}

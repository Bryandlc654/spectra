import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
export declare class TenantsService {
    private repo;
    constructor(repo: Repository<Tenant>);
    findAll(page?: number, limit?: number): Promise<{
        data: Tenant[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<Tenant>;
    findUsers(id: number, page?: number, limit?: number): Promise<{
        data: import("typeorm").ObjectLiteral[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(dto: CreateTenantDto): Promise<Tenant>;
    update(id: number, dto: UpdateTenantDto): Promise<Tenant>;
    remove(id: number): Promise<Tenant>;
}

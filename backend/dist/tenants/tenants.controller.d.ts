import { TenantsService } from './tenants.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
export declare class TenantsController {
    private service;
    private activityLog;
    constructor(service: TenantsService, activityLog: ActivityLogsService);
    findAll(page?: string, limit?: string): Promise<{
        data: import("./tenant.entity").Tenant[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<import("./tenant.entity").Tenant>;
    findUsers(id: string, page?: string, limit?: string): Promise<{
        data: import("typeorm").ObjectLiteral[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    create(req: any, dto: CreateTenantDto): Promise<import("./tenant.entity").Tenant>;
    update(req: any, id: string, dto: UpdateTenantDto): Promise<import("./tenant.entity").Tenant>;
    remove(req: any, id: string): Promise<{
        message: string;
    }>;
}

import { SuperAdminService } from './super-admin.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
export declare class SuperAdminController {
    private service;
    private activityLog;
    constructor(service: SuperAdminService, activityLog: ActivityLogsService);
    getDashboard(): Promise<{
        stats: {
            totalUsers: number;
            admins: number;
            freelancers: number;
        };
        recentUsers: import("../users/user.entity").User[];
    }>;
    getAdminTenants(page?: string, limit?: string): Promise<{
        data: import("../users/user.entity").User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createAdminTenant(req: any, body: {
        name: string;
        email: string;
        phone?: string;
        tenantId?: number;
    }): Promise<import("../users/user.entity").User>;
    updateAdminTenant(req: any, id: string, body: {
        name?: string;
        email?: string;
        phone?: string;
        tenantId?: number;
    }): Promise<import("../users/user.entity").User>;
    deleteAdminTenant(req: any, id: string): Promise<{
        message: string;
    }>;
    getFreelancers(page?: string, limit?: string): Promise<{
        data: import("../users/user.entity").User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    createFreelancer(req: any, body: {
        name: string;
        email: string;
        phone?: string;
        country?: string;
        documentId?: string;
        areaId?: number;
        yearsOfExperience?: number;
        skills?: string;
        bio?: string;
        tenantId?: number;
    }): Promise<import("../users/user.entity").User>;
    updateFreelancer(req: any, id: string, body: {
        name?: string;
        email?: string;
        password?: string;
        phone?: string;
        country?: string;
        documentId?: string;
        areaId?: number;
        yearsOfExperience?: number;
        skills?: string;
        bio?: string;
        tenantId?: number;
    }): Promise<import("../users/user.entity").User>;
    deleteFreelancer(req: any, id: string): Promise<{
        message: string;
    }>;
}

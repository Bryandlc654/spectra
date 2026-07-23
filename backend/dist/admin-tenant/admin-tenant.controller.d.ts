import { AdminTenantService } from './admin-tenant.service';
export declare class AdminTenantController {
    private service;
    constructor(service: AdminTenantService);
    getDashboard(req: any): Promise<{
        admin: import("../users/user.entity").User;
        stats: {
            freelancers: number;
        };
        recentFreelancers: import("../users/user.entity").User[];
    }>;
}

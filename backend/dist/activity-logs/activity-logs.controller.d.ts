import { ActivityLogsService } from './activity-logs.service';
export declare class ActivityLogsController {
    private service;
    constructor(service: ActivityLogsService);
    findAll(page?: string, limit?: string, action?: string, entityType?: string, userId?: string): Promise<{
        data: import("./activity-log.entity").ActivityLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getActions(): Promise<any[]>;
    getEntityTypes(): Promise<any[]>;
    cleanup(): Promise<{
        deleted: number | null | undefined;
    }>;
}

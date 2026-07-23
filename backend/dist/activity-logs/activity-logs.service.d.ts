import { Repository } from 'typeorm';
import { ActivityLog } from './activity-log.entity';
export declare class ActivityLogsService {
    private repo;
    private readonly RETENTION_DAYS;
    constructor(repo: Repository<ActivityLog>);
    log(data: {
        userId: number;
        userName?: string;
        action: string;
        entityType: string;
        entityId?: number;
        description?: string;
        metadata?: any;
    }): Promise<void>;
    findAll(page?: number, limit?: number, filters?: {
        action?: string;
        entityType?: string;
        userId?: number;
    }): Promise<{
        data: ActivityLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getDistinctActions(): Promise<any[]>;
    getDistinctEntityTypes(): Promise<any[]>;
    cleanupOldLogs(): Promise<{
        deleted: number | null | undefined;
    }>;
}

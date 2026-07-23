import { Repository } from 'typeorm';
import { SessionLog } from './session-log.entity';
export declare class SessionLogsService {
    private repo;
    constructor(repo: Repository<SessionLog>);
    log(data: {
        userId: number;
        userName?: string;
        userRole?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<void>;
    findAll(page?: number, limit?: number): Promise<{
        data: SessionLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

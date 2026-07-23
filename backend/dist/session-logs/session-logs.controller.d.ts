import { SessionLogsService } from './session-logs.service';
export declare class SessionLogsController {
    private service;
    constructor(service: SessionLogsService);
    findAll(page?: string, limit?: string): Promise<{
        data: import("./session-log.entity").SessionLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

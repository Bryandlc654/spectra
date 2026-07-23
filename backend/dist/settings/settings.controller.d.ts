import { SettingsService } from './settings.service';
export declare class SettingsController {
    private service;
    constructor(service: SettingsService);
    findAll(): Promise<import("./setting.entity").Setting[]>;
    update(body: {
        settings: {
            key: string;
            value: string;
        }[];
    }): Promise<import("./setting.entity").Setting[]>;
    getSmtp(): Promise<Record<string, string | null>>;
    updateSmtp(body: {
        host: string;
        port: string;
        user: string;
        pass: string;
        from: string;
    }): Promise<{
        message: string;
    }>;
}

import { SettingsService } from '../settings/settings.service';
export declare class EmailService {
    private settingsService?;
    private transporter;
    private from;
    private initialized;
    constructor(settingsService?: SettingsService | undefined);
    private ensureInit;
    refreshConfig(): Promise<void>;
    sendCredentials(email: string, name: string, password: string, tenantName?: string): Promise<void>;
    sendRaw(to: string, subject: string, html: string): Promise<void>;
}

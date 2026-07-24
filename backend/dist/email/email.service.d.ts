export declare class EmailService {
    private readonly logger;
    private apiKey;
    private from;
    constructor();
    private send;
    sendCredentials(email: string, name: string, password: string, tenantName?: string): Promise<void>;
    sendRaw(to: string, subject: string, html: string): Promise<void>;
    sendInvitation(email: string, name: string, inviteUrl: string, tenantName?: string): Promise<void>;
}

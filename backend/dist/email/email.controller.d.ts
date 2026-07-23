import { EmailService } from './email.service';
export declare class EmailController {
    private emailService;
    constructor(emailService: EmailService);
    test(body: {
        to: string;
    }): Promise<{
        message: string;
    }>;
    refresh(): Promise<{
        message: string;
    }>;
}

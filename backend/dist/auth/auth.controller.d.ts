import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { SessionLogsService } from '../session-logs/session-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
export declare class AuthController {
    private authService;
    private emailService;
    private sessionLogs;
    private readonly logger;
    constructor(authService: AuthService, emailService: EmailService, sessionLogs: SessionLogsService);
    register(req: any, dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            phone: any;
        };
    }>;
    login(req: any, dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            phone: any;
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    acceptInvitation(dto: AcceptInvitationDto): Promise<{
        message: string;
    }>;
}

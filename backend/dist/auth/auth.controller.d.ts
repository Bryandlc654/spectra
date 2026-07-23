import { AuthService } from './auth.service';
import { SessionLogsService } from '../session-logs/session-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    private sessionLogs;
    constructor(authService: AuthService, sessionLogs: SessionLogsService);
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
}

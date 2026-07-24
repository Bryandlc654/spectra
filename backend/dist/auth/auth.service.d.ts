import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
export declare class AuthService {
    private usersService;
    private jwtService;
    private usersRepository;
    constructor(usersService: UsersService, jwtService: JwtService, usersRepository: Repository<User>);
    register(dto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            phone: any;
        };
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            email: any;
            name: any;
            role: any;
            phone: any;
        };
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
        resetUrl?: undefined;
        userName?: undefined;
        userEmail?: undefined;
    } | {
        message: string;
        resetUrl: string;
        userName: string;
        userEmail: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    acceptInvitation(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    private generateToken;
}

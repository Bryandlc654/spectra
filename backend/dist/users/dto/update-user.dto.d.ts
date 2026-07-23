import { UserRole } from '../user.entity';
export declare class UpdateUserDto {
    name?: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    isActive?: boolean;
}

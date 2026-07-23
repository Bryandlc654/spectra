import { CustomRole } from '../custom-roles/custom-role.entity';
export declare class ManagedUser {
    id: number;
    email: string;
    password: string;
    name: string;
    role: CustomRole;
    roleId: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

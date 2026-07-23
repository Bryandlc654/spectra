import { CustomRole } from './custom-role.entity';
export declare class RolePermission {
    id: number;
    moduleKey: string;
    canAccess: boolean;
    role: CustomRole;
    roleId: number;
}

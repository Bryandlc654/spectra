import { RolePermission } from './role-permission.entity';
import { ManagedUser } from '../managed-users/managed-user.entity';
export declare class CustomRole {
    id: number;
    name: string;
    description: string;
    permissions: RolePermission[];
    managedUsers: ManagedUser[];
    createdAt: Date;
    updatedAt: Date;
}

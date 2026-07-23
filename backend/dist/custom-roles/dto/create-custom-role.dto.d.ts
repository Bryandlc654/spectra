declare class PermissionDto {
    moduleKey: string;
    canAccess: boolean;
}
export declare class CreateCustomRoleDto {
    name: string;
    description?: string;
    permissions?: PermissionDto[];
}
export {};

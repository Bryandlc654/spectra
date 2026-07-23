declare class PermissionDto {
    moduleKey: string;
    canAccess: boolean;
}
export declare class UpdateCustomRoleDto {
    name?: string;
    description?: string;
    permissions?: PermissionDto[];
}
export {};

import { Tenant } from '../tenants/tenant.entity';
import { Area } from '../areas/area.entity';
export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    ADMIN_TENANT = "admin_tenant",
    FREELANCE = "freelance"
}
export declare class User {
    id: number;
    email: string;
    password: string;
    name: string;
    role: UserRole;
    phone: string;
    code: string;
    country: string;
    documentId: string;
    area: Area;
    areaId: number;
    yearsOfExperience: number;
    skills: string;
    bio: string;
    tenant: Tenant;
    tenantId: number;
    isActive: boolean;
    invitationToken: string;
    invitationExpires: Date;
    createdAt: Date;
    updatedAt: Date;
}

import { User } from '../users/user.entity';
export declare class Tenant {
    id: number;
    logo: string;
    taxId: string;
    businessName: string;
    name: string;
    country: string;
    baseCurrency: string;
    status: string;
    email: string;
    phone: string;
    address: string;
    users: User[];
    createdAt: Date;
    updatedAt: Date;
}

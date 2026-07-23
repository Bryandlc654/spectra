import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
export declare class AdminTenantService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    getDashboard(adminId: number): Promise<{
        admin: User;
        stats: {
            freelancers: number;
        };
        recentFreelancers: User[];
    }>;
}

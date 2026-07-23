import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
export declare class FreelanceService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    getProfile(userId: number): Promise<{
        profile: User;
    }>;
}

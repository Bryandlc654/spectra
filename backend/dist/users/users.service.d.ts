import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private usersRepository;
    constructor(usersRepository: Repository<User>);
    findAll(page?: number, limit?: number): Promise<{
        data: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findById(id: number): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: Partial<User>): Promise<User>;
    update(id: number, dto: UpdateUserDto): Promise<User>;
    updatePassword(id: number, hashedPassword: string): Promise<void>;
    remove(id: number): Promise<void>;
}

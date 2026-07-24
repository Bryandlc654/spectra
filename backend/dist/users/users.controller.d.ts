import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    findAll(page?: string, limit?: string): Promise<{
        data: import("./user.entity").User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<import("./user.entity").User | null>;
    update(id: string, dto: UpdateUserDto): Promise<import("./user.entity").User>;
    remove(id: string): Promise<void>;
}

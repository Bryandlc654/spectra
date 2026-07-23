import { Repository } from 'typeorm';
import { ManagedUser } from './managed-user.entity';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
export declare class ManagedUsersService {
    private repo;
    constructor(repo: Repository<ManagedUser>);
    findAll(): Promise<ManagedUser[]>;
    findById(id: number): Promise<ManagedUser>;
    findByEmail(email: string): Promise<ManagedUser | null>;
    create(dto: CreateManagedUserDto): Promise<ManagedUser>;
    update(id: number, dto: UpdateManagedUserDto): Promise<ManagedUser>;
    remove(id: number): Promise<ManagedUser>;
}

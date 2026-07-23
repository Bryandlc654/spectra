import { Repository } from 'typeorm';
import { CustomRole } from './custom-role.entity';
import { RolePermission } from './role-permission.entity';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
export declare class CustomRolesService {
    private repo;
    private permRepo;
    constructor(repo: Repository<CustomRole>, permRepo: Repository<RolePermission>);
    findAll(): Promise<CustomRole[]>;
    findById(id: number): Promise<CustomRole>;
    create(dto: CreateCustomRoleDto): Promise<CustomRole>;
    update(id: number, dto: UpdateCustomRoleDto): Promise<CustomRole>;
    remove(id: number): Promise<CustomRole>;
}

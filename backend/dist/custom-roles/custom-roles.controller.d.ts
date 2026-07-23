import { CustomRolesService } from './custom-roles.service';
import { CreateCustomRoleDto } from './dto/create-custom-role.dto';
import { UpdateCustomRoleDto } from './dto/update-custom-role.dto';
export declare class CustomRolesController {
    private service;
    constructor(service: CustomRolesService);
    findAll(): Promise<import("./custom-role.entity").CustomRole[]>;
    findOne(id: string): Promise<import("./custom-role.entity").CustomRole>;
    create(dto: CreateCustomRoleDto): Promise<import("./custom-role.entity").CustomRole>;
    update(id: string, dto: UpdateCustomRoleDto): Promise<import("./custom-role.entity").CustomRole>;
    remove(id: string): Promise<import("./custom-role.entity").CustomRole>;
}

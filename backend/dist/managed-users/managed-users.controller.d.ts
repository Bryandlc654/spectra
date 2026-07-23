import { ManagedUsersService } from './managed-users.service';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateManagedUserDto } from './dto/update-managed-user.dto';
export declare class ManagedUsersController {
    private service;
    constructor(service: ManagedUsersService);
    findAll(): Promise<import("./managed-user.entity").ManagedUser[]>;
    findOne(id: string): Promise<import("./managed-user.entity").ManagedUser>;
    create(dto: CreateManagedUserDto): Promise<import("./managed-user.entity").ManagedUser>;
    update(id: string, dto: UpdateManagedUserDto): Promise<import("./managed-user.entity").ManagedUser>;
    remove(id: string): Promise<import("./managed-user.entity").ManagedUser>;
}

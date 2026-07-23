import { AreasService } from './areas.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
export declare class AreasController {
    private service;
    constructor(service: AreasService);
    findAll(): Promise<import("./area.entity").Area[]>;
    findOne(id: string): Promise<import("./area.entity").Area>;
    create(dto: CreateAreaDto): Promise<import("./area.entity").Area>;
    update(id: string, dto: UpdateAreaDto): Promise<import("./area.entity").Area>;
    remove(id: string): Promise<import("./area.entity").Area>;
}

import { Repository } from 'typeorm';
import { Area } from './area.entity';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
export declare class AreasService {
    private repo;
    constructor(repo: Repository<Area>);
    findAll(): Promise<Area[]>;
    findById(id: number): Promise<Area>;
    create(dto: CreateAreaDto): Promise<Area>;
    update(id: number, dto: UpdateAreaDto): Promise<Area>;
    remove(id: number): Promise<Area>;
}

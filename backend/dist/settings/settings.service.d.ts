import { Repository } from 'typeorm';
import { Setting } from './setting.entity';
export declare class SettingsService {
    private repo;
    constructor(repo: Repository<Setting>);
    findAll(): Promise<Setting[]>;
    get(key: string): Promise<string | null>;
    getAll(keys: string[]): Promise<Record<string, string | null>>;
    set(key: string, value: string): Promise<Setting>;
    setBulk(entries: {
        key: string;
        value: string;
    }[]): Promise<Setting[]>;
    remove(key: string): Promise<void>;
}

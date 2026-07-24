"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const setting_entity_1 = require("./setting.entity");
let SettingsService = class SettingsService {
    constructor(repo) {
        this.repo = repo;
    }
    async findAll() {
        return this.repo.find({ order: { key: 'ASC' } });
    }
    async get(key) {
        const setting = await this.repo.findOne({ where: { key } });
        return setting?.value ?? null;
    }
    async getAll(keys) {
        const settings = await this.repo.find({ where: keys.map((k) => ({ key: k })) });
        const result = {};
        keys.forEach((k) => {
            const found = settings.find((s) => s.key === k);
            result[k] = found?.value ?? null;
        });
        return result;
    }
    async set(key, value) {
        const existing = await this.repo.findOne({ where: { key } });
        if (existing) {
            existing.value = value;
            return this.repo.save(existing);
        }
        const setting = this.repo.create({ key, value });
        return this.repo.save(setting);
    }
    async setBulk(entries) {
        if (entries.length === 0)
            return this.findAll();
        const keys = entries.map((e) => e.key);
        const existing = await this.repo.find({ where: keys.map((k) => ({ key: k })) });
        const existingMap = new Map(existing.map((s) => [s.key, s]));
        const toSave = [];
        for (const entry of entries) {
            const found = existingMap.get(entry.key);
            if (found) {
                found.value = entry.value;
                toSave.push(found);
            }
            else {
                toSave.push(this.repo.create(entry));
            }
        }
        await this.repo.save(toSave);
        return this.findAll();
    }
    async remove(key) {
        const setting = await this.repo.findOne({ where: { key } });
        if (setting)
            await this.repo.remove(setting);
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(setting_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map
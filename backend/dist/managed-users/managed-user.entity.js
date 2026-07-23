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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManagedUser = void 0;
const typeorm_1 = require("typeorm");
const custom_role_entity_1 = require("../custom-roles/custom-role.entity");
let ManagedUser = class ManagedUser {
};
exports.ManagedUser = ManagedUser;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ManagedUser.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], ManagedUser.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ManagedUser.prototype, "password", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ManagedUser.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => custom_role_entity_1.CustomRole),
    (0, typeorm_1.JoinColumn)({ name: 'roleId' }),
    __metadata("design:type", custom_role_entity_1.CustomRole)
], ManagedUser.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], ManagedUser.prototype, "roleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ManagedUser.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ManagedUser.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ManagedUser.prototype, "updatedAt", void 0);
exports.ManagedUser = ManagedUser = __decorate([
    (0, typeorm_1.Entity)('managed_users'),
    (0, typeorm_1.Index)(['roleId']),
    (0, typeorm_1.Index)(['createdAt'])
], ManagedUser);
//# sourceMappingURL=managed-user.entity.js.map
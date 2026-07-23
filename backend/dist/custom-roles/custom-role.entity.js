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
exports.CustomRole = void 0;
const typeorm_1 = require("typeorm");
const role_permission_entity_1 = require("./role-permission.entity");
const managed_user_entity_1 = require("../managed-users/managed-user.entity");
let CustomRole = class CustomRole {
};
exports.CustomRole = CustomRole;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], CustomRole.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], CustomRole.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CustomRole.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => role_permission_entity_1.RolePermission, (rp) => rp.role, { cascade: true }),
    __metadata("design:type", Array)
], CustomRole.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => managed_user_entity_1.ManagedUser, (mu) => mu.role),
    __metadata("design:type", Array)
], CustomRole.prototype, "managedUsers", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CustomRole.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CustomRole.prototype, "updatedAt", void 0);
exports.CustomRole = CustomRole = __decorate([
    (0, typeorm_1.Entity)('custom_roles'),
    (0, typeorm_1.Index)(['createdAt'])
], CustomRole);
//# sourceMappingURL=custom-role.entity.js.map
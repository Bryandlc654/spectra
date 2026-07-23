"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRolesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const custom_roles_controller_1 = require("./custom-roles.controller");
const custom_roles_service_1 = require("./custom-roles.service");
const custom_role_entity_1 = require("./custom-role.entity");
const role_permission_entity_1 = require("./role-permission.entity");
let CustomRolesModule = class CustomRolesModule {
};
exports.CustomRolesModule = CustomRolesModule;
exports.CustomRolesModule = CustomRolesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([custom_role_entity_1.CustomRole, role_permission_entity_1.RolePermission])],
        controllers: [custom_roles_controller_1.CustomRolesController],
        providers: [custom_roles_service_1.CustomRolesService],
        exports: [custom_roles_service_1.CustomRolesService],
    })
], CustomRolesModule);
//# sourceMappingURL=custom-roles.module.js.map
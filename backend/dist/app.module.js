"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const super_admin_module_1 = require("./super-admin/super-admin.module");
const admin_tenant_module_1 = require("./admin-tenant/admin-tenant.module");
const freelance_module_1 = require("./freelance/freelance.module");
const tenants_module_1 = require("./tenants/tenants.module");
const custom_roles_module_1 = require("./custom-roles/custom-roles.module");
const managed_users_module_1 = require("./managed-users/managed-users.module");
const modules_module_1 = require("./modules/modules.module");
const areas_module_1 = require("./areas/areas.module");
const activity_logs_module_1 = require("./activity-logs/activity-logs.module");
const kyc_module_1 = require("./kyc/kyc.module");
const settings_module_1 = require("./settings/settings.module");
const session_logs_module_1 = require("./session-logs/session-logs.module");
const contracts_module_1 = require("./contracts/contracts.module");
const signatures_module_1 = require("./signatures/signatures.module");
const email_module_1 = require("./email/email.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST || 'localhost',
                port: Number(process.env.DB_PORT) || 3306,
                username: process.env.DB_USERNAME || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_DATABASE || 'spectra_db',
                autoLoadEntities: true,
                synchronize: process.env.DB_SYNC === 'true',
            }),
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            tenants_module_1.TenantsModule,
            custom_roles_module_1.CustomRolesModule,
            managed_users_module_1.ManagedUsersModule,
            modules_module_1.ModulesModule,
            areas_module_1.AreasModule,
            activity_logs_module_1.ActivityLogsModule,
            kyc_module_1.KycModule,
            settings_module_1.SettingsModule,
            session_logs_module_1.SessionLogsModule,
            contracts_module_1.ContractsModule,
            signatures_module_1.SignaturesModule,
            email_module_1.EmailModule,
            super_admin_module_1.SuperAdminModule,
            admin_tenant_module_1.AdminTenantModule,
            freelance_module_1.FreelanceModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
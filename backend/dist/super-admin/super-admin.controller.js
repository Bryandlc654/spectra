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
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const super_admin_service_1 = require("./super-admin.service");
const activity_logs_service_1 = require("../activity-logs/activity-logs.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_guard_1 = require("../common/roles.guard");
const roles_decorator_1 = require("../common/roles.decorator");
function logUserAction(logger, req, action, entityType, entityId, description) {
    const user = req.user;
    logger.log({ userId: user.id, userName: user.email, action, entityType, entityId, description }).catch(() => { });
}
let SuperAdminController = class SuperAdminController {
    constructor(service, activityLog) {
        this.service = service;
        this.activityLog = activityLog;
    }
    getDashboard() {
        return this.service.getDashboard();
    }
    getAdminTenants() {
        return this.service.getAdminTenants();
    }
    async createAdminTenant(req, body) {
        const result = await this.service.createAdminTenant(body);
        logUserAction(this.activityLog, req, 'create', 'admin_tenant', result.id, `Creó admin tenant: ${body.name}`);
        return result;
    }
    async updateAdminTenant(req, id, body) {
        const result = await this.service.updateAdminTenant(+id, body);
        logUserAction(this.activityLog, req, 'update', 'admin_tenant', +id, `Actualizó admin tenant ID ${id}`);
        return result;
    }
    async deleteAdminTenant(req, id) {
        await this.service.deleteAdminTenant(+id);
        logUserAction(this.activityLog, req, 'delete', 'admin_tenant', +id, `Eliminó admin tenant ID ${id}`);
        return { message: 'Deleted' };
    }
    getFreelancers() {
        return this.service.getFreelancers();
    }
    async createFreelancer(req, body) {
        const result = await this.service.createFreelancer(body);
        logUserAction(this.activityLog, req, 'create', 'freelancer', result.id, `Creó freelancer: ${body.name}`);
        return result;
    }
    async updateFreelancer(req, id, body) {
        const result = await this.service.updateFreelancer(+id, body);
        logUserAction(this.activityLog, req, 'update', 'freelancer', +id, `Actualizó freelancer ID ${id}`);
        return result;
    }
    async deleteFreelancer(req, id) {
        await this.service.deleteFreelancer(+id);
        logUserAction(this.activityLog, req, 'delete', 'freelancer', +id, `Eliminó freelancer ID ${id}`);
        return { message: 'Deleted' };
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('admin-tenants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getAdminTenants", null);
__decorate([
    (0, common_1.Post)('admin-tenants'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createAdminTenant", null);
__decorate([
    (0, common_1.Put)('admin-tenants/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateAdminTenant", null);
__decorate([
    (0, common_1.Delete)('admin-tenants/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteAdminTenant", null);
__decorate([
    (0, common_1.Get)('freelancers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SuperAdminController.prototype, "getFreelancers", null);
__decorate([
    (0, common_1.Post)('freelancers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createFreelancer", null);
__decorate([
    (0, common_1.Put)('freelancers/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateFreelancer", null);
__decorate([
    (0, common_1.Delete)('freelancers/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "deleteFreelancer", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, common_1.Controller)('super-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('super_admin'),
    __metadata("design:paramtypes", [super_admin_service_1.SuperAdminService,
        activity_logs_service_1.ActivityLogsService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map
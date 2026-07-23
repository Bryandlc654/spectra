"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionLogsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const session_logs_controller_1 = require("./session-logs.controller");
const session_logs_service_1 = require("./session-logs.service");
const session_log_entity_1 = require("./session-log.entity");
let SessionLogsModule = class SessionLogsModule {
};
exports.SessionLogsModule = SessionLogsModule;
exports.SessionLogsModule = SessionLogsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([session_log_entity_1.SessionLog])],
        controllers: [session_logs_controller_1.SessionLogsController],
        providers: [session_logs_service_1.SessionLogsService],
        exports: [session_logs_service_1.SessionLogsService],
    })
], SessionLogsModule);
//# sourceMappingURL=session-logs.module.js.map
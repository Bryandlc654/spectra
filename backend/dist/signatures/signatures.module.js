"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SignaturesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const platform_express_1 = require("@nestjs/platform-express");
const signatures_controller_1 = require("./signatures.controller");
const signatures_service_1 = require("./signatures.service");
const sign_document_entity_1 = require("./sign-document.entity");
const signer_entity_1 = require("./signer.entity");
const email_module_1 = require("../email/email.module");
let SignaturesModule = class SignaturesModule {
};
exports.SignaturesModule = SignaturesModule;
exports.SignaturesModule = SignaturesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([sign_document_entity_1.SignDocument, signer_entity_1.Signer]),
            platform_express_1.MulterModule.register({ dest: './uploads' }),
            email_module_1.EmailModule,
        ],
        controllers: [signatures_controller_1.SignaturesController],
        providers: [signatures_service_1.SignaturesService],
        exports: [signatures_service_1.SignaturesService],
    })
], SignaturesModule);
//# sourceMappingURL=signatures.module.js.map
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
exports.KycRequest = exports.KycStatus = void 0;
const typeorm_1 = require("typeorm");
const kyc_document_entity_1 = require("./kyc-document.entity");
const user_entity_1 = require("../users/user.entity");
var KycStatus;
(function (KycStatus) {
    KycStatus["PENDING"] = "pending";
    KycStatus["APPROVED"] = "approved";
    KycStatus["REJECTED"] = "rejected";
})(KycStatus || (exports.KycStatus = KycStatus = {}));
let KycRequest = class KycRequest {
};
exports.KycRequest = KycRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], KycRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], KycRequest.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], KycRequest.prototype, "userType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING }),
    __metadata("design:type", String)
], KycRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], KycRequest.prototype, "adminNotes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => kyc_document_entity_1.KycDocument, (doc) => doc.kycRequest, { cascade: true }),
    __metadata("design:type", Array)
], KycRequest.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", user_entity_1.User)
], KycRequest.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], KycRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], KycRequest.prototype, "updatedAt", void 0);
exports.KycRequest = KycRequest = __decorate([
    (0, typeorm_1.Entity)('kyc_requests'),
    (0, typeorm_1.Index)(['userId']),
    (0, typeorm_1.Index)(['status'])
], KycRequest);
//# sourceMappingURL=kyc-request.entity.js.map
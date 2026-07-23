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
exports.SignDocument = exports.DocStatus = void 0;
const typeorm_1 = require("typeorm");
const signer_entity_1 = require("./signer.entity");
var DocStatus;
(function (DocStatus) {
    DocStatus["DRAFT"] = "draft";
    DocStatus["SENT"] = "sent";
    DocStatus["COMPLETED"] = "completed";
})(DocStatus || (exports.DocStatus = DocStatus = {}));
let SignDocument = class SignDocument {
};
exports.SignDocument = SignDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], SignDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SignDocument.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], SignDocument.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SignDocument.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SignDocument.prototype, "originalName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], SignDocument.prototype, "mimeType", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], SignDocument.prototype, "ownerUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: DocStatus, default: DocStatus.DRAFT }),
    __metadata("design:type", String)
], SignDocument.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => signer_entity_1.Signer, (s) => s.document, { cascade: true }),
    __metadata("design:type", Array)
], SignDocument.prototype, "signers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], SignDocument.prototype, "certificateData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], SignDocument.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SignDocument.prototype, "updatedAt", void 0);
exports.SignDocument = SignDocument = __decorate([
    (0, typeorm_1.Entity)('sign_documents'),
    (0, typeorm_1.Index)(['ownerUserId'])
], SignDocument);
//# sourceMappingURL=sign-document.entity.js.map
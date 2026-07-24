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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const email_service_1 = require("../email/email.service");
const session_logs_service_1 = require("../session-logs/session-logs.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const accept_invitation_dto_1 = require("./dto/accept-invitation.dto");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService, emailService, sessionLogs) {
        this.authService = authService;
        this.emailService = emailService;
        this.sessionLogs = sessionLogs;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async register(req, dto) {
        const result = await this.authService.register(dto);
        this.sessionLogs.log({
            userId: result.user.id,
            userName: result.user.name,
            userRole: result.user.role,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent'],
        }).catch((err) => this.logger.error('Failed to log register session', err));
        return result;
    }
    async login(req, dto) {
        const result = await this.authService.login(dto);
        this.sessionLogs.log({
            userId: result.user.id,
            userName: result.user.name,
            userRole: result.user.role,
            ipAddress: req.ip,
            userAgent: req.headers?.['user-agent'],
        }).catch((err) => this.logger.error('Failed to log login session', err));
        return result;
    }
    async forgotPassword(dto) {
        const result = await this.authService.forgotPassword(dto.email);
        if (result.resetUrl && result.userEmail) {
            const html = `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <div style="background: #006d70; padding: 28px 32px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Spectra</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Recuperación de contraseña</p>
          </div>
          <div style="padding: 32px;">
            <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hola <strong>${result.userName}</strong>,</p>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
              Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña.
            </p>
            <a href="${result.resetUrl}"
               style="display: block; background: #006d70; color: #fff; text-decoration: none; text-align: center; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
              Restablecer contraseña
            </a>
            <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
              Este enlace expirará en 1 hora. Si no solicitaste este cambio, puedes ignorar este mensaje.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Spectra. Todos los derechos reservados.</p>
          </div>
        </div>
      `;
            this.emailService.sendRaw(result.userEmail, 'Restablecer contraseña - Spectra', html)
                .catch((err) => this.logger.error('Failed to send reset email', err));
        }
        return { message: result.message };
    }
    async resetPassword(dto) {
        return this.authService.resetPassword(dto.token, dto.newPassword);
    }
    async acceptInvitation(dto) {
        return this.authService.acceptInvitation(dto.token, dto.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, register_dto_1.RegisterDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('accept-invitation'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [accept_invitation_dto_1.AcceptInvitationDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "acceptInvitation", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    (0, common_1.UseGuards)(throttler_1.ThrottlerGuard),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        email_service_1.EmailService,
        session_logs_service_1.SessionLogsService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map
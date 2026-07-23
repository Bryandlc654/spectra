"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const nodemailer = __importStar(require("nodemailer"));
const settings_service_1 = require("../settings/settings.service");
let EmailService = class EmailService {
    constructor(settingsService) {
        this.settingsService = settingsService;
        this.transporter = null;
        this.from = process.env.SMTP_FROM || 'noreply@spectra.com';
        this.initialized = false;
    }
    async ensureInit() {
        if (this.initialized && this.transporter)
            return;
        let host = process.env.SMTP_HOST || 'smtp.gmail.com';
        let port = Number(process.env.SMTP_PORT) || 587;
        let user = process.env.SMTP_USER || '';
        let pass = process.env.SMTP_PASS || '';
        this.from = process.env.SMTP_FROM || 'noreply@spectra.com';
        if (this.settingsService) {
            try {
                const smtp = await this.settingsService.getAll(['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']);
                if (smtp.smtp_host)
                    host = smtp.smtp_host;
                if (smtp.smtp_port)
                    port = Number(smtp.smtp_port);
                if (smtp.smtp_user)
                    user = smtp.smtp_user;
                if (smtp.smtp_pass)
                    pass = smtp.smtp_pass;
                if (smtp.smtp_from)
                    this.from = smtp.smtp_from;
            }
            catch { }
        }
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: user && pass ? { user, pass } : undefined,
        });
        this.initialized = true;
    }
    async refreshConfig() {
        this.initialized = false;
        await this.ensureInit();
    }
    async sendCredentials(email, name, password, tenantName) {
        await this.ensureInit();
        if (!this.transporter) {
            console.error('SMTP not configured');
            return;
        }
        const subject = tenantName
            ? `Bienvenido a Spectra - Acceso como administrador de ${tenantName}`
            : 'Bienvenido a Spectra - Acceso al panel';
        const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: #006d70; padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Spectra</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Panel de administración</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hola <strong>${name}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
            Se ha creado tu cuenta de administrador${tenantName ? ` para <strong>${tenantName}</strong>` : ''}.
            Estas son tus credenciales de acceso:
          </p>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px; font-size: 13px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Credenciales</p>
            <p style="margin: 0 0 8px; font-size: 14px; color: #374151;">
              <span style="color: #6b7280;">Email:</span> <strong style="color: #006d70;">${email}</strong>
            </p>
            <p style="margin: 0; font-size: 14px; color: #374151;">
              <span style="color: #6b7280;">Contraseña:</span> <strong style="font-family: monospace;">${password}</strong>
            </p>
          </div>
          <a href="${process.env.APP_URL || 'http://localhost:5173'}/login"
             style="display: block; background: #006d70; color: #fff; text-decoration: none; text-align: center; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
            Ir al panel
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
            Por seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Spectra. Todos los derechos reservados.</p>
        </div>
      </div>
    `;
        try {
            await this.transporter.sendMail({
                from: this.from,
                to: email,
                subject,
                html,
            });
        }
        catch (err) {
            console.error('Failed to send email:', err);
        }
    }
    async sendRaw(to, subject, html) {
        await this.ensureInit();
        if (!this.transporter) {
            console.error('SMTP not configured');
            return;
        }
        try {
            await this.transporter.sendMail({ from: this.from, to, subject, html });
        }
        catch (err) {
            console.error('Failed to send email:', err);
        }
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)(settings_service_1.SettingsService)),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], EmailService);
//# sourceMappingURL=email.service.js.map
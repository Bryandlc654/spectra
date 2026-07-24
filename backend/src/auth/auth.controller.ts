import { Controller, Post, Body, Req, Logger, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';
import { SessionLogsService } from '../session-logs/session-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private emailService: EmailService,
    private sessionLogs: SessionLogsService,
  ) {}

  @Post('register')
  async register(@Req() req: any, @Body() dto: RegisterDto) {
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

  @Post('login')
  async login(@Req() req: any, @Body() dto: LoginDto) {
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

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
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

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('accept-invitation')
  async acceptInvitation(@Req() req: any, @Body() dto: AcceptInvitationDto) {
    const result = await this.authService.acceptInvitation(dto.token, dto.newPassword);
    const user = await this.authService.findUserByInvitationToken(dto.token).catch(() => null);
    if (user) {
      this.sessionLogs.log({
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        ipAddress: req.ip,
        userAgent: req.headers?.['user-agent'],
      }).catch((err) => this.logger.error('Failed to log accept-invitation session', err));
    }
    return result;
  }
}

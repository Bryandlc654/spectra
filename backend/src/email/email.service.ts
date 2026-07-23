import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiKey: string | undefined;
  private from: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;
    this.from = process.env.RESEND_FROM || 'noreply@spectra.com';
    if (!this.apiKey) {
      this.logger.warn('RESEND_API_KEY not configured');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (!this.apiKey) {
      this.logger.error('Resend not configured - RESEND_API_KEY is missing');
      throw new Error('Email service not configured');
    }
    this.logger.log(`Sending email to ${to} with subject "${subject}"`);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    });
    if (!res.ok) {
      const err = await res.text();
      this.logger.error(`Resend error (${res.status}): ${err}`);
      throw new Error(`Email send failed: ${err}`);
    }
    this.logger.log(`Email sent successfully to ${to}`);
  }

  async sendCredentials(email: string, name: string, password: string, tenantName?: string) {
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

    await this.send(email, subject, html);
  }

  async sendRaw(to: string, subject: string, html: string) {
    await this.send(to, subject, html);
  }

  async sendInvitation(email: string, name: string, inviteUrl: string, tenantName?: string) {
    const subject = tenantName
      ? `Invitación a Spectra - Administrador de ${tenantName}`
      : 'Invitación a Spectra - Crea tu contraseña';

    const html = `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: #006d70; padding: 28px 32px; text-align: center;">
          <h1 style="color: #fff; margin: 0; font-size: 22px; font-weight: 700;">Spectra</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Invitación de acceso</p>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hola <strong>${name}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px; line-height: 1.6;">
            Has sido invitado${tenantName ? ` a administrar <strong>${tenantName}</strong>` : ''} en Spectra.
            Haz clic en el botón de abajo para crear tu contraseña y activar tu cuenta.
          </p>
          <a href="${inviteUrl}"
             style="display: block; background: #006d70; color: #fff; text-decoration: none; text-align: center; padding: 12px; border-radius: 10px; font-size: 14px; font-weight: 600; margin-bottom: 20px;">
            Crear mi contraseña
          </a>
          <p style="color: #9ca3af; font-size: 12px; margin: 0; line-height: 1.5;">
            Este enlace expirará en 7 días. Si no esperabas esta invitación, puedes ignorar este mensaje.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 11px; margin: 0;">© ${new Date().getFullYear()} Spectra. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    await this.send(email, subject, html);
  }
}

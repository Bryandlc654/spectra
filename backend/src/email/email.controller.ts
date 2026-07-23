import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('email')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('test')
  async test(@Body() body: { to: string }) {
    await this.emailService.sendCredentials(
      body.to || 'test@example.com',
      'Test',
      'TestPassword123!',
    );
    return { message: 'Test email sent' };
  }

  @Post('refresh')
  async refresh() {
    await this.emailService.refreshConfig();
    return { message: 'SMTP config refreshed' };
  }
}

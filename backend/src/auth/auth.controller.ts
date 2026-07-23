import { Controller, Post, Body, Req, Logger, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SessionLogsService } from '../session-logs/session-logs.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
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
}

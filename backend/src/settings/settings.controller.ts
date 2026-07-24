import { Controller, Get, Put, Body, Query, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(Number(page) || 1, Math.min(Number(limit) || 100, 200));
  }

  @Put()
  update(@Body() body: { settings: { key: string; value: string }[] }) {
    return this.service.setBulk(body.settings);
  }

  @Get('smtp')
  getSmtp() {
    return this.service.getAll(['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from']);
  }

  @Put('smtp')
  async updateSmtp(@Body() body: { host: string; port: string; user: string; pass: string; from: string }) {
    await this.service.setBulk([
      { key: 'smtp_host', value: body.host },
      { key: 'smtp_port', value: body.port },
      { key: 'smtp_user', value: body.user },
      { key: 'smtp_pass', value: body.pass },
      { key: 'smtp_from', value: body.from },
    ]);
    return { message: 'SMTP settings updated' };
  }
}

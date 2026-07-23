import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SessionLogsService } from './session-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('session-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SessionLogsController {
  constructor(private service: SessionLogsService) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(Number(page) || 1, Math.min(Number(limit) || 50, 100));
  }
}

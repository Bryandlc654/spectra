import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class ActivityLogsController {
  constructor(private service: ActivityLogsService) {}

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('userId') userId?: string,
  ) {
    return this.service.findAll(
      Number(page) || 1,
      Math.min(Number(limit) || 50, 100),
      { action, entityType, userId: userId ? Number(userId) : undefined },
    );
  }

  @Get('actions')
  getActions() {
    return this.service.getDistinctActions();
  }

  @Get('entity-types')
  getEntityTypes() {
    return this.service.getDistinctEntityTypes();
  }

  @Get('cleanup')
  cleanup() {
    return this.service.cleanupOldLogs();
  }
}

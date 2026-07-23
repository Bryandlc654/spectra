import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query, Logger } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const logger = new Logger('Tenants');

function logUserAction(activityLog: ActivityLogsService, req: any, action: string, entityType: string, entityId?: number, description?: string) {
  const user = req.user;
  activityLog.log({ userId: user.id, userName: user.email, action, entityType, entityId, description })
    .catch((err) => logger.error(`Failed to log activity: ${action} ${entityType}`, err));
}

@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class TenantsController {
  constructor(
    private service: TenantsService,
    private activityLog: ActivityLogsService,
  ) {}

  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(page ? +page : 1, limit ? +limit : 50);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findById(+id); }

  @Get(':id/users')
  findUsers(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findUsers(+id, page ? +page : 1, limit ? +limit : 50);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateTenantDto) {
    const result = await this.service.create(dto);
    logUserAction(this.activityLog, req, 'create', 'tenant', result.id, `Creó tenant: ${dto.businessName}`);
    return result;
  }

  @Put(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const result = await this.service.update(+id, dto);
    logUserAction(this.activityLog, req, 'update', 'tenant', +id, `Actualizó tenant ID ${id}`);
    return result;
  }

  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    await this.service.remove(+id);
    logUserAction(this.activityLog, req, 'delete', 'tenant', +id, `Eliminó tenant ID ${id}`);
    return { message: 'Deleted' };
  }
}

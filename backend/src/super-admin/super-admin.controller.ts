import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query, Logger } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

const logger = new Logger('SuperAdmin');

function logUserAction(activityLog: ActivityLogsService, req: any, action: string, entityType: string, entityId?: number, description?: string) {
  const user = req.user;
  activityLog.log({ userId: user.id, userName: user.email, action, entityType, entityId, description })
    .catch((err) => logger.error(`Failed to log activity: ${action} ${entityType}`, err));
}

@Controller('super-admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class SuperAdminController {
  constructor(
    private service: SuperAdminService,
    private activityLog: ActivityLogsService,
  ) {}

  @Get('dashboard')
  getDashboard() {
    return this.service.getDashboard();
  }

  @Get('admin-tenants')
  getAdminTenants(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getAdminTenants(page ? +page : 1, limit ? +limit : 50);
  }

  @Post('admin-tenants')
  async createAdminTenant(@Req() req: any, @Body() body: { name: string; email: string; phone?: string; tenantId?: number }) {
    const result = await this.service.createAdminTenant(body);
    logUserAction(this.activityLog, req, 'create', 'admin_tenant', result.id, `Creó admin tenant: ${body.name}`);
    return result;
  }

  @Put('admin-tenants/:id')
  async updateAdminTenant(@Req() req: any, @Param('id') id: string, @Body() body: { name?: string; email?: string; phone?: string; tenantId?: number }) {
    const result = await this.service.updateAdminTenant(+id, body);
    logUserAction(this.activityLog, req, 'update', 'admin_tenant', +id, `Actualizó admin tenant ID ${id}`);
    return result;
  }

  @Delete('admin-tenants/:id')
  async deleteAdminTenant(@Req() req: any, @Param('id') id: string) {
    await this.service.deleteAdminTenant(+id);
    logUserAction(this.activityLog, req, 'delete', 'admin_tenant', +id, `Eliminó admin tenant ID ${id}`);
    return { message: 'Deleted' };
  }

  @Get('freelancers')
  getFreelancers(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.getFreelancers(page ? +page : 1, limit ? +limit : 50);
  }

  @Post('freelancers')
  async createFreelancer(@Req() req: any, @Body() body: { name: string; email: string; phone?: string; country?: string; documentId?: string; areaId?: number; yearsOfExperience?: number; skills?: string; bio?: string; tenantId?: number }) {
    const result = await this.service.createFreelancer(body);
    logUserAction(this.activityLog, req, 'create', 'freelancer', result.id, `Creó freelancer: ${body.name}`);
    return result;
  }

  @Put('freelancers/:id')
  async updateFreelancer(@Req() req: any, @Param('id') id: string, @Body() body: { name?: string; email?: string; password?: string; phone?: string; country?: string; documentId?: string; areaId?: number; yearsOfExperience?: number; skills?: string; bio?: string; tenantId?: number }) {
    const result = await this.service.updateFreelancer(+id, body);
    logUserAction(this.activityLog, req, 'update', 'freelancer', +id, `Actualizó freelancer ID ${id}`);
    return result;
  }

  @Delete('freelancers/:id')
  async deleteFreelancer(@Req() req: any, @Param('id') id: string) {
    await this.service.deleteFreelancer(+id);
    logUserAction(this.activityLog, req, 'delete', 'freelancer', +id, `Eliminó freelancer ID ${id}`);
    return { message: 'Deleted' };
  }
}

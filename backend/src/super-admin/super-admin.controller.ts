import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Req, Query, Logger, Res, ParseIntPipe } from '@nestjs/common';
import { Response } from 'express';
import { SuperAdminService } from './super-admin.service';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';
import { CreateAdminTenantDto } from './dto/create-admin-tenant.dto';
import { UpdateAdminTenantDto } from './dto/update-admin-tenant.dto';
import { CreateFreelancerDto } from './dto/create-freelancer.dto';
import { UpdateFreelancerDto } from './dto/update-freelancer.dto';
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
  getAdminTenants(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.service.getAdminTenants(page ? +page : 1, limit ? +limit : 50, search);
  }

  @Post('admin-tenants')
  async createAdminTenant(@Req() req: any, @Body() dto: CreateAdminTenantDto) {
    const result = await this.service.createAdminTenant(dto);
    logUserAction(this.activityLog, req, 'create', 'admin_tenant', result.id, `Creó admin tenant: ${dto.name}`);
    return result;
  }

  @Put('admin-tenants/:id')
  async updateAdminTenant(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAdminTenantDto) {
    const result = await this.service.updateAdminTenant(id, dto);
    logUserAction(this.activityLog, req, 'update', 'admin_tenant', id, `Actualizó admin tenant ID ${id}`);
    return result;
  }

  @Delete('admin-tenants/:id')
  async deleteAdminTenant(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteAdminTenant(id);
    logUserAction(this.activityLog, req, 'delete', 'admin_tenant', id, `Eliminó admin tenant ID ${id}`);
    return { message: 'Deleted' };
  }

  @Get('freelancers')
  getFreelancers(@Query('page') page?: string, @Query('limit') limit?: string, @Query('search') search?: string) {
    return this.service.getFreelancers(page ? +page : 1, limit ? +limit : 50, search);
  }

  @Post('freelancers')
  async createFreelancer(@Req() req: any, @Body() dto: CreateFreelancerDto) {
    const result = await this.service.createFreelancer(dto);
    logUserAction(this.activityLog, req, 'create', 'freelancer', result.id, `Creó freelancer: ${dto.name}`);
    return result;
  }

  @Put('freelancers/:id')
  async updateFreelancer(@Req() req: any, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFreelancerDto) {
    const result = await this.service.updateFreelancer(id, dto);
    logUserAction(this.activityLog, req, 'update', 'freelancer', id, `Actualizó freelancer ID ${id}`);
    return result;
  }

  @Delete('freelancers/:id')
  async deleteFreelancer(@Req() req: any, @Param('id', ParseIntPipe) id: number) {
    await this.service.deleteFreelancer(id);
    logUserAction(this.activityLog, req, 'delete', 'freelancer', id, `Eliminó freelancer ID ${id}`);
    return { message: 'Deleted' };
  }

  // ─── EXPORTS ──────────────────────────────────────────────

  @Get('export/admin-tenants/csv')
  async exportAdminTenantsCsv(@Res() res: Response, @Query('search') search?: string) {
    const result = await this.service.getAdminTenants(1, 10000, search);
    const rows = [
      ['ID', 'Nombre', 'Email', 'Teléfono', 'Tenant', 'Estado', 'Fecha de creación'],
      ...result.data.map((u: any) => [
        u.id,
        u.name,
        u.email,
        u.phone || '',
        u.tenant?.businessName || '',
        u.isActive ? 'Activo' : 'Inactivo',
        new Date(u.createdAt).toLocaleDateString('es-ES'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="admin-tenants.csv"');
    res.send('\uFEFF' + csv);
  }

  @Get('export/freelancers/csv')
  async exportFreelancersCsv(@Res() res: Response, @Query('search') search?: string) {
    const result = await this.service.getFreelancers(1, 10000, search);
    const rows = [
      ['ID', 'Código', 'Nombre', 'Email', 'País', 'Área', 'Experiencia', 'Tenant', 'Fecha de creación'],
      ...result.data.map((u: any) => [
        u.id,
        u.code || '',
        u.name,
        u.email,
        u.country || '',
        u.area?.name || '',
        u.yearsOfExperience ? `${u.yearsOfExperience} años` : '',
        u.tenant?.businessName || '',
        new Date(u.createdAt).toLocaleDateString('es-ES'),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="freelancers.csv"');
    res.send('\uFEFF' + csv);
  }
}

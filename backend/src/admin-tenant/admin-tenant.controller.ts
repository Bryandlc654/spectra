import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AdminTenantService } from './admin-tenant.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('admin-tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin_tenant')
export class AdminTenantController {
  constructor(private service: AdminTenantService) {}

  @Get('dashboard')
  getDashboard(@Req() req: any) {
    return this.service.getDashboard(req.user.id);
  }
}

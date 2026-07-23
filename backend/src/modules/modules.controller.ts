import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { AVAILABLE_MODULES } from './modules.config';

@Controller('modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
export class ModulesController {
  @Get()
  findAll() {
    return AVAILABLE_MODULES;
  }
}

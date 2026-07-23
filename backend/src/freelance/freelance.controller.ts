import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { FreelanceService } from './freelance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@Controller('freelance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('freelance')
export class FreelanceController {
  constructor(private service: FreelanceService) {}

  @Get('profile')
  getProfile(@Req() req: any) {
    return this.service.getProfile(req.user.id);
  }
}

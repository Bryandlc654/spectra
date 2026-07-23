import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdminController } from './super-admin.controller';
import { SuperAdminService } from './super-admin.service';
import { User } from '../users/user.entity';
import { EmailModule } from '../email/email.module';
import { TenantsModule } from '../tenants/tenants.module';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), EmailModule, TenantsModule, ActivityLogsModule, KycModule],
  controllers: [SuperAdminController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}

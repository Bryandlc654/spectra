import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { AdminTenantModule } from './admin-tenant/admin-tenant.module';
import { FreelanceModule } from './freelance/freelance.module';
import { TenantsModule } from './tenants/tenants.module';
import { CustomRolesModule } from './custom-roles/custom-roles.module';
import { ManagedUsersModule } from './managed-users/managed-users.module';
import { ModulesModule } from './modules/modules.module';
import { AreasModule } from './areas/areas.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { KycModule } from './kyc/kyc.module';
import { KybModule } from './kyb/kyb.module';
import { SettingsModule } from './settings/settings.module';
import { SessionLogsModule } from './session-logs/session-logs.module';
import { ContractsModule } from './contracts/contracts.module';
import { SignaturesModule } from './signatures/signatures.module';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'spectra_db',
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC === 'true',
    }),
    AuthModule,
    UsersModule,
    TenantsModule,
    CustomRolesModule,
    ManagedUsersModule,
    ModulesModule,
    AreasModule,
    ActivityLogsModule,
    KycModule,
    KybModule,
    SettingsModule,
    SessionLogsModule,
    ContractsModule,
    SignaturesModule,
    EmailModule,
    SuperAdminModule,
    AdminTenantModule,
    FreelanceModule,
  ],
})
export class AppModule {}

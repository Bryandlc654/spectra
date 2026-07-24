import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminTenantController } from './admin-tenant.controller';
import { AdminTenantService } from './admin-tenant.service';
import { User } from '../users/user.entity';
import { Contract } from '../contracts/contract.entity';
import { ContractTemplate } from '../contracts/contract-template.entity';
import { KycRequest } from '../kyc/kyc-request.entity';
import { KycDocument } from '../kyc/kyc-document.entity';
import { Area } from '../areas/area.entity';
import { Tenant } from '../tenants/tenant.entity';
import { KybRequest } from '../kyb/kyb-request.entity';
import { KybDocument } from '../kyb/kyb-document.entity';
import { ContractsModule } from '../contracts/contracts.module';
import { KycModule } from '../kyc/kyc.module';
import { KybModule } from '../kyb/kyb.module';
import { EmailModule } from '../email/email.module';
import { SignaturesModule } from '../signatures/signatures.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Contract, ContractTemplate, KycRequest, KycDocument, Area, Tenant, KybRequest, KybDocument]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRATION || '24h' },
    }),
    ContractsModule,
    KycModule,
    KybModule,
    EmailModule,
    SignaturesModule,
  ],
  controllers: [AdminTenantController],
  providers: [AdminTenantService],
})
export class AdminTenantModule {}

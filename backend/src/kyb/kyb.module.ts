import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KybRequest } from './kyb-request.entity';
import { KybDocument } from './kyb-document.entity';
import { KybService } from './kyb.service';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KybRequest, KybDocument, Tenant])],
  providers: [KybService],
  exports: [KybService],
})
export class KybModule {}

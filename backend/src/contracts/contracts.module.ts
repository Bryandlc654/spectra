import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractsController } from './contracts.controller';
import { ContractTemplatesService } from './contract-templates.service';
import { ContractsService } from './contracts.service';
import { ContractTemplate } from './contract-template.entity';
import { Contract } from './contract.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ContractTemplate, Contract])],
  controllers: [ContractsController],
  providers: [ContractTemplatesService, ContractsService],
  exports: [ContractTemplatesService, ContractsService],
})
export class ContractsModule {}

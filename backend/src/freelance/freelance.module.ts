import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { FreelanceController } from './freelance.controller';
import { FreelanceService } from './freelance.service';
import { User } from '../users/user.entity';
import { Contract } from '../contracts/contract.entity';
import { KycRequest } from '../kyc/kyc-request.entity';
import { KycDocument } from '../kyc/kyc-document.entity';
import { Area } from '../areas/area.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Contract, KycRequest, KycDocument, Area]),
    MulterModule.register({ dest: './uploads' }),
  ],
  controllers: [FreelanceController],
  providers: [FreelanceService],
})
export class FreelanceModule {}

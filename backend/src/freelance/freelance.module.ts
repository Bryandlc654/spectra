import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FreelanceController } from './freelance.controller';
import { FreelanceService } from './freelance.service';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [FreelanceController],
  providers: [FreelanceService],
})
export class FreelanceModule {}

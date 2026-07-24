import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
import { KycRequest } from './kyc-request.entity';
import { KycDocument } from './kyc-document.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([KycRequest, KycDocument]),
    MulterModule.register({ dest: './uploads' }),
    EmailModule,
  ],
  controllers: [KycController],
  providers: [KycService],
  exports: [KycService],
})
export class KycModule {}

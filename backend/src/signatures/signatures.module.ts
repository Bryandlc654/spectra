import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { SignaturesController } from './signatures.controller';
import { SignaturesService } from './signatures.service';
import { SignDocument } from './sign-document.entity';
import { Signer } from './signer.entity';
import { EmailModule } from '../email/email.module';
import { Contract } from '../contracts/contract.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SignDocument, Signer, Contract]),
    MulterModule.register({ dest: './uploads' }),
    EmailModule,
  ],
  controllers: [SignaturesController],
  providers: [SignaturesService],
  exports: [SignaturesService],
})
export class SignaturesModule {}

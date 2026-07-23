import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagedUsersController } from './managed-users.controller';
import { ManagedUsersService } from './managed-users.service';
import { ManagedUser } from './managed-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ManagedUser])],
  controllers: [ManagedUsersController],
  providers: [ManagedUsersService],
  exports: [ManagedUsersService],
})
export class ManagedUsersModule {}

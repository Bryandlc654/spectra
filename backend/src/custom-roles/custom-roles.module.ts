import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomRolesController } from './custom-roles.controller';
import { CustomRolesService } from './custom-roles.service';
import { CustomRole } from './custom-role.entity';
import { RolePermission } from './role-permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CustomRole, RolePermission])],
  controllers: [CustomRolesController],
  providers: [CustomRolesService],
  exports: [CustomRolesService],
})
export class CustomRolesModule {}

import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateAdminTenantDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  tenantId?: number;
}

import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateAdminTenantDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  tenantId?: number;
}

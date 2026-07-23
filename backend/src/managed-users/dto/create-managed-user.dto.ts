import { IsString, IsEmail, MinLength, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateManagedUserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsInt()
  roleId: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

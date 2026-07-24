import { IsString, IsOptional, IsNumber, IsIn, MaxLength } from 'class-validator';

export const ALLOWED_DOC_TYPES = ['identity', 'cv', 'tenant_document'] as const;

export class UpdateFreelanceProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  documentId?: string;

  @IsOptional()
  @IsNumber()
  areaId?: number;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  skills?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;
}

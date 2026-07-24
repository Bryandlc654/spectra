import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateContractDto {
  @IsNumber()
  templateId: number;

  @IsNumber()
  freelancerUserId: number;

  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  freelancerName?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  customData?: Record<string, any>;
}

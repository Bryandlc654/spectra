import { IsString, IsNumber, IsOptional, IsObject, MaxLength, MinLength, Min } from 'class-validator';

export class CreateContractDto {
  @IsNumber()
  @Min(1)
  templateId: number;

  @IsNumber()
  @Min(1)
  freelancerUserId: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  freelancerName?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  title: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsObject()
  customData?: Record<string, string>;
}

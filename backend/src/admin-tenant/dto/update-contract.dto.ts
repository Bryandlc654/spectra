import { IsString, IsNumber, IsOptional, MaxLength, Min } from 'class-validator';

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

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
  @IsString()
  firstPaymentDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentFrequency?: number;

  @IsOptional()
  @IsString()
  paymentNotes?: string;
}

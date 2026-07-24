import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { KycStatus } from '../../kyc/kyc-request.entity';

export class UpdateKycStatusDto {
  @IsEnum(KycStatus, { message: `status must be one of: ${Object.values(KycStatus).join(', ')}` })
  status: KycStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  adminNotes?: string;
}

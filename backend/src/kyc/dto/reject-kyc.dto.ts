import { IsString, IsOptional } from 'class-validator';

export class RejectKycDto {
  @IsString()
  adminNotes: string;
}

import { IsOptional, IsString, IsIn } from 'class-validator';

export const ALLOWED_DOC_TYPES = ['identity', 'cv', 'tenant_document'] as const;

export class UploadKycDocumentDto {
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_DOC_TYPES, { message: `type must be one of: ${ALLOWED_DOC_TYPES.join(', ')}` })
  type?: string;
}

import { IsOptional, IsString, IsIn } from 'class-validator';
import { ALLOWED_DOC_TYPES } from './update-profile.dto';

export class UploadKycDocumentDto {
  @IsOptional()
  @IsString()
  @IsIn(ALLOWED_DOC_TYPES, { message: `type must be one of: ${ALLOWED_DOC_TYPES.join(', ')}` })
  type?: string;
}

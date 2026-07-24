import { IsEnum } from 'class-validator';
import { ContractStatus } from '../../contracts/contract.entity';

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus, { message: `status must be one of: ${Object.values(ContractStatus).join(', ')}` })
  status: ContractStatus;
}

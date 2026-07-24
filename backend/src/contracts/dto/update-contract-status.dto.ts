import { IsEnum } from 'class-validator';
import { ContractStatus } from '../contract.entity';

export class UpdateContractStatusDto {
  @IsEnum(ContractStatus)
  status: ContractStatus;
}

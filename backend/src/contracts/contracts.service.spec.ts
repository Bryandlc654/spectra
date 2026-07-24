import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Contract, ContractStatus } from './contract.entity';
import { ContractTemplatesService } from './contract-templates.service';

describe('ContractsService', () => {
  let service: ContractsService;

  const mockContract: Partial<Contract> = {
    id: 1,
    title: 'Test Contract',
    freelancerName: 'John Doe',
    status: ContractStatus.DRAFT,
    content: 'Content here',
  };

  const createMockQb = () => {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    return qb;
  };

  const mockContractRepo = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(() => createMockQb()),
  };

  const mockTemplatesService = {
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: getRepositoryToken(Contract), useValue: mockContractRepo },
        { provide: ContractTemplatesService, useValue: mockTemplatesService },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findAll', () => {
    it('should return paginated contracts', async () => {
      const mockQb = createMockQb();
      mockQb.getManyAndCount.mockResolvedValue([[mockContract], 1]);
      mockContractRepo.createQueryBuilder.mockReturnValue(mockQb);

      const result = await service.findAll({}, 1, 10);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total', 1);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('totalPages', 1);
      expect(result.data).toEqual([mockContract]);
    });

    it('should apply filters', async () => {
      const mockQb = createMockQb();
      mockQb.getManyAndCount.mockResolvedValue([[], 0]);
      mockContractRepo.createQueryBuilder.mockReturnValue(mockQb);

      await service.findAll({ tenantUserId: 5, status: 'draft' }, 1, 10);
      expect(mockQb.andWhere).toHaveBeenCalledWith('contract.tenantUserId = :tenantUserId', { tenantUserId: 5 });
      expect(mockQb.andWhere).toHaveBeenCalledWith('contract.status = :status', { status: 'draft' });
    });
  });

  describe('findById', () => {
    it('should return a contract by id', async () => {
      mockContractRepo.findOne.mockResolvedValue(mockContract);
      const result = await service.findById(1);
      expect(result).toEqual(mockContract);
    });

    it('should throw if not found', async () => {
      mockContractRepo.findOne.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow('Contract not found');
    });
  });

  describe('create', () => {
    it('should create a contract with rendered content', async () => {
      mockTemplatesService.findById.mockResolvedValue({
        id: 1,
        name: 'Template',
        content: 'Contrato entre {{freelancer_name}} y {{tenant_name}}',
      });
      mockContractRepo.create.mockReturnValue(mockContract);
      mockContractRepo.save.mockResolvedValue({ ...mockContract, id: 1 });

      const result = await service.create({
        templateId: 1,
        tenantUserId: 1,
        tenantName: 'Tenant SA',
        freelancerUserId: 2,
        freelancerName: 'John Doe',
        title: 'Test Contract',
      });

      expect(mockTemplatesService.findById).toHaveBeenCalledWith(1);
      expect(mockContractRepo.create).toHaveBeenCalled();
      expect(mockContractRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('id');
    });

    it('should throw if template not found', async () => {
      mockTemplatesService.findById.mockRejectedValue(new Error('Template not found'));
      await expect(
        service.create({ templateId: 999, tenantUserId: 1, freelancerUserId: 2, title: 'Test' }),
      ).rejects.toThrow('Template not found');
    });
  });

  describe('remove', () => {
    it('should delete a contract', async () => {
      mockContractRepo.findOne.mockResolvedValue(mockContract);
      mockContractRepo.remove.mockResolvedValue(mockContract);

      await service.remove(1);
      expect(mockContractRepo.remove).toHaveBeenCalledWith(mockContract);
    });

    it('should throw if contract not found', async () => {
      mockContractRepo.findOne.mockResolvedValue(null);
      await expect(service.remove(999)).rejects.toThrow('Contract not found');
    });
  });
});

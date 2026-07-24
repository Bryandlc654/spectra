import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: Partial<User> = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.ADMIN_TENANT,
    password: '$2a$10$hashed',
    isActive: true,
    invitationToken: undefined,
    invitationExpires: undefined,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
    verify: jest.fn(),
  };

  const mockUserRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register a new user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.ADMIN_TENANT,
      });

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
    });

    it('should throw if email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ name: 'Test', email: 'test@example.com', password: 'Pass123!', role: UserRole.ADMIN_TENANT }),
      ).rejects.toThrow('Email already registered');
    });
  });

  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });

      const result = await service.login({ email: 'test@example.com', password: 'Password123!' });
      expect(result).toHaveProperty('access_token');
      expect(mockJwtService.sign).toHaveBeenCalled();
    });

    it('should throw on invalid credentials (user not found)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'Wrong123!' }),
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw on invalid credentials (wrong password)', async () => {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      mockUsersService.findByEmail.mockResolvedValue({ ...mockUser, password: hashedPassword });

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('forgotPassword', () => {
    it('should return message with resetUrl for existing user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('reset-token');

      const result = await service.forgotPassword('test@example.com');
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('resetUrl');
    });

    it('should return generic message if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');
      expect(result).toHaveProperty('message');
    });
  });

  describe('acceptInvitation', () => {
    it('should set password and clear token on valid token', async () => {
      mockJwtService.verify.mockReturnValue({ email: 'test@example.com', type: 'admin_invitation' });
      const userWithToken = { ...mockUser, invitationToken: 'valid-token', invitationExpires: new Date(Date.now() + 86400000) };
      mockUsersService.findByEmail.mockResolvedValue(userWithToken);
      mockUserRepo.save.mockResolvedValue(userWithToken);

      const result = await service.acceptInvitation('valid-token', 'NewPass123!');
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUserRepo.save).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('should throw on invalid/expired token', async () => {
      mockJwtService.verify.mockImplementation(() => { throw new Error('invalid'); });
      await expect(service.acceptInvitation('bad-token', 'NewPass123!')).rejects.toThrow();
    });

    it('should throw on non-invitation token type', async () => {
      mockJwtService.verify.mockReturnValue({ email: 'test@example.com', type: 'access' });
      await expect(service.acceptInvitation('wrong-type-token', 'NewPass123!')).rejects.toThrow('Token inválido');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-value'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('AuthService - validateOAuthUser', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let prismaService: any;

  const baseMockUser = {
    id: 1,
    name: 'Existing User',
    email: 'existing@example.com',
    password: 'hashed-password',
    role: 'USUARIO',
    googleId: null,
    appleId: null,
    refreshToken: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    prismaService = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Google OAuth', () => {
    const googleProfile = {
      email: 'google@example.com',
      name: 'Google User',
      providerId: 'google-id-123',
    };

    it('should create new user with role USUARIO', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        id: 2,
        name: 'Google User',
        email: 'google@example.com',
        password: null,
        googleId: 'google-id-123',
        appleId: null,
        role: 'USUARIO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.validateOAuthUser(googleProfile, 'google');

      expect(result).not.toHaveProperty('password');
      expect(result.email).toBe('google@example.com');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Google User',
          email: 'google@example.com',
          googleId: 'google-id-123',
        },
      });
    });

    it('should link to existing user by email', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(baseMockUser as any);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...baseMockUser,
        googleId: 'google-id-123',
      });

      const result = await service.validateOAuthUser(googleProfile, 'google');

      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { googleId: 'google-id-123' },
      });
    });
  });

  describe('Apple OAuth', () => {
    const appleProfile = {
      email: 'apple@example.com',
      name: 'Apple User',
      providerId: 'apple-id-456',
    };

    it('should create new user', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
        id: 3,
        name: 'Apple User',
        email: 'apple@example.com',
        password: null,
        googleId: null,
        appleId: 'apple-id-456',
        role: 'USUARIO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.validateOAuthUser(appleProfile, 'apple');

      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: 'Apple User',
          email: 'apple@example.com',
          appleId: 'apple-id-456',
        },
      });
    });

    it('should link to existing user', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(baseMockUser as any);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...baseMockUser,
        appleId: 'apple-id-456',
      });

      const result = await service.validateOAuthUser(appleProfile, 'apple');

      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { appleId: 'apple-id-456' },
      });
    });
  });

  describe('Updates provider ID on existing user', () => {
    it('should update googleId on existing user found by provider', async () => {
      const existingGoogleUser = {
        ...baseMockUser,
        googleId: 'google-id-123',
      };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(existingGoogleUser);

      const result = await service.validateOAuthUser(
        { email: 'google@example.com', name: 'Google User', providerId: 'google-id-123' },
        'google',
      );

      expect(result).not.toHaveProperty('password');
      expect(result.id).toBe(1);
      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should update appleId on existing user found by email', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(baseMockUser as any);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...baseMockUser,
        appleId: 'apple-id-new',
      });

      const result = await service.validateOAuthUser(
        { email: 'existing@example.com', name: 'Existing User', providerId: 'apple-id-new' },
        'apple',
      );

      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { appleId: 'apple-id-new' },
      });
    });
  });
});

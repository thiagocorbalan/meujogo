import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-value'),
  compare: jest.fn().mockResolvedValue(true),
}));

jest.mock('crypto', () => ({
  randomUUID: jest.fn().mockReturnValue('mock-uuid'),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;
  let prismaService: any;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashed-password',
    role: 'USUARIO',
    googleId: null,
    appleId: null,
    refreshToken: 'hashed-refresh-token',
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithoutPassword = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USUARIO',
    googleId: null,
    appleId: null,
    refreshToken: 'hashed-refresh-token',
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
      verify: jest.fn(),
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
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password for valid credentials', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result!.id).toBe(1);
      expect(result!.email).toBe('test@example.com');
    });

    it('should return null for wrong password', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return null for non-existent email', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate accessToken and refreshToken', async () => {
      jwtService.sign!
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      usersService.updateRefreshToken!.mockResolvedValue(undefined as any);

      const result = await service.login(mockUserWithoutPassword, false);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual(mockUserWithoutPassword);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should generate 30d refresh token when rememberMe is true', async () => {
      jwtService.sign!
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token-30d');
      usersService.updateRefreshToken!.mockResolvedValue(undefined as any);

      await service.login(mockUserWithoutPassword, true);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 1, role: 'USUARIO' },
        expect.objectContaining({ expiresIn: '30d' }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new accessToken for valid token', async () => {
      jwtService.verify!.mockReturnValue({ sub: 1, role: 'USUARIO' });
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign!.mockReturnValue('new-access-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      jwtService.verify!.mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refreshToken in DB', async () => {
      usersService.updateRefreshToken!.mockResolvedValue(undefined as any);

      await service.logout(1);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(1, null);
    });
  });

  describe('forgotPassword', () => {
    it('should generate resetToken for existing email', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      prismaService.user.update.mockResolvedValue(mockUser);

      await service.forgotPassword('test@example.com');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          resetToken: 'mock-uuid',
          resetTokenExpiry: expect.any(Date),
        },
      });
    });

    it('should NOT throw for non-existent email', async () => {
      usersService.findByEmail!.mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).resolves.not.toThrow();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should update password with valid token', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      prismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        resetToken: 'valid-token',
        resetTokenExpiry: futureDate,
      });
      prismaService.user.update.mockResolvedValue(mockUser);

      await service.resetPassword('valid-token', 'new-password');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          password: 'hashed-value',
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
    });

    it('should throw BadRequestException for expired token', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000);
      prismaService.user.findFirst.mockResolvedValue({
        ...mockUser,
        resetToken: 'expired-token',
        resetTokenExpiry: pastDate,
      });

      await expect(
        service.resetPassword('expired-token', 'new-password'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateOAuthUser', () => {
    const profile = {
      email: 'oauth@example.com',
      name: 'OAuth User',
      providerId: 'google-123',
    };

    it('should create new user when no existing user found', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      usersService.findByEmail!.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({
        id: 2,
        name: 'OAuth User',
        email: 'oauth@example.com',
        password: null,
        googleId: 'google-123',
        appleId: null,
        role: 'USUARIO',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.validateOAuthUser(profile, 'google');

      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: 'OAuth User',
          email: 'oauth@example.com',
          googleId: 'google-123',
        },
      });
    });

    it('should link to existing user by email', async () => {
      prismaService.user.findFirst.mockResolvedValue(null);
      usersService.findByEmail!.mockResolvedValue(mockUser as any);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        googleId: 'google-123',
      });

      const result = await service.validateOAuthUser(profile, 'google');

      expect(result).not.toHaveProperty('password');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { googleId: 'google-123' },
      });
    });
  });
});

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
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnValue({
      digest: jest.fn().mockReturnValue('hashed-mock-uuid'),
    }),
  }),
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
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result!.id).toBe(1);
      expect(result!.email).toBe('test@example.com');
    });

    it('should return null for wrong password', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });

    it('should return null for non-existent email', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate accessToken and refreshToken', async () => {
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token');
      (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined as any);

      const result = await service.login(mockUserWithoutPassword, false);

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user).toEqual(mockUserWithoutPassword);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });

    it('should generate 30d refresh token when rememberMe is true', async () => {
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('access-token')
        .mockReturnValueOnce('refresh-token-30d');
      (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined as any);

      await service.login(mockUserWithoutPassword, true);

      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 1, role: 'USUARIO', rememberMe: true },
        expect.objectContaining({ expiresIn: '30d' }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should return new accessToken and rotated refreshToken for valid token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 1, role: 'USUARIO' });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.rememberMe).toBe(false);
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(1, 'hashed-value');
    });

    it('should generate 30d refresh token when original had rememberMe', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue({ sub: 1, role: 'USUARIO', rememberMe: true });
      (prismaService.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token-30d');

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.rememberMe).toBe(true);
      expect(jwtService.sign).toHaveBeenCalledWith(
        { sub: 1, role: 'USUARIO', rememberMe: true },
        expect.objectContaining({ expiresIn: '30d' }),
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('invalid');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should clear refreshToken in DB', async () => {
      (usersService.updateRefreshToken as jest.Mock).mockResolvedValue(undefined as any);

      await service.logout(1);

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(1, null);
    });
  });

  describe('forgotPassword', () => {
    it('should generate resetToken for existing email', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser as any);
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

      await service.forgotPassword('test@example.com');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          resetToken: 'hashed-mock-uuid',
          resetTokenExpiry: expect.any(Date),
        },
      });
    });

    it('should NOT throw for non-existent email', async () => {
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);

      await expect(
        service.forgotPassword('nonexistent@example.com'),
      ).resolves.not.toThrow();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should update password with valid token', async () => {
      const futureDate = new Date(Date.now() + 60 * 60 * 1000);
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
        ...mockUser,
        resetToken: 'valid-token',
        resetTokenExpiry: futureDate,
      });
      (prismaService.user.update as jest.Mock).mockResolvedValue(mockUser);

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
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue({
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
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(null);
      (prismaService.user.create as jest.Mock).mockResolvedValue({
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

    it('should throw UnauthorizedException when linking to user with password', async () => {
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(mockUser as any);

      await expect(
        service.validateOAuthUser(profile, 'google'),
      ).rejects.toThrow(UnauthorizedException);
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('should link to existing OAuth-only user by email', async () => {
      const oauthOnlyUser = { ...mockUser, password: null };
      (prismaService.user.findFirst as jest.Mock).mockResolvedValue(null);
      (usersService.findByEmail as jest.Mock).mockResolvedValue(oauthOnlyUser as any);
      (prismaService.user.update as jest.Mock).mockResolvedValue({
        ...oauthOnlyUser,
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

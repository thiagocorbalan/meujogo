import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USUARIO',
  };

  const mockTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    user: mockUser,
  };

  function createMockResponse() {
    const cookies: Array<{
      name: string;
      value: string;
      options: Record<string, any>;
    }> = [];
    const clearedCookies: Array<{ name: string; options?: any }> = [];

    return {
      cookie: jest.fn((name: string, value: string, options: any) => {
        cookies.push({ name, value, options });
      }),
      clearCookie: jest.fn((name: string, options?: any) => {
        clearedCookies.push({ name, options });
      }),
      redirect: jest.fn(),
      getCookies: () => cookies,
      getClearedCookies: () => clearedCookies,
    };
  }

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      forgotPassword: jest.fn(),
      resetPassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should return 200 with tokens for valid credentials', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      (authService.login as jest.Mock).mockResolvedValue(mockTokens);
      const res = createMockResponse();

      const result = await controller.login(
        { email: 'test@example.com', password: 'password123' },
        res as any,
      );

      expect(result).toEqual({ user: mockUser });
      expect(authService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(authService.login).toHaveBeenCalledWith(mockUser, false);
    });

    it('should throw 401 for invalid credentials', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(null);
      const res = createMockResponse();

      await expect(
        controller.login(
          { email: 'test@example.com', password: 'wrong-password' },
          res as any,
        ),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 200 with new access token', async () => {
      (authService.refreshToken as jest.Mock).mockResolvedValue({
        accessToken: 'new-access-token',
      });
      const req = { cookies: {} } as any;
      const res = createMockResponse();

      const result = await controller.refresh(
        { refreshToken: 'valid-refresh-token' },
        req,
        res as any,
      );

      expect(result).toEqual({ message: 'Token atualizado com sucesso' });
    });
  });

  describe('POST /auth/logout', () => {
    it('should return 200', async () => {
      (authService.logout as jest.Mock).mockResolvedValue(undefined);
      const res = createMockResponse();

      const req = { user: { id: 1 } };
      const result = await controller.logout(req, res as any);

      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
      expect(authService.logout).toHaveBeenCalledWith(1);
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return 200 always', async () => {
      (authService.forgotPassword as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.forgotPassword({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        message: 'Se o email existir, enviaremos um link de recuperação',
      });
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should return 200 with valid token', async () => {
      (authService.resetPassword as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.resetPassword({
        token: 'valid-token',
        password: 'new-password',
      });

      expect(result).toEqual({ message: 'Senha redefinida com sucesso' });
      expect(authService.resetPassword).toHaveBeenCalledWith(
        'valid-token',
        'new-password',
      );
    });
  });

  describe('GET /auth/me', () => {
    it('should return user from request', () => {
      const req = { user: mockUser };

      const result = controller.getMe(req);

      expect(result).toEqual(mockUser);
    });
  });
});

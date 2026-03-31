import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('REQ-SEC-07 + REQ-SEC-08: Login Cookie Flow', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    role: 'USUARIO',
  };

  const mockTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
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
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      getCookies: () => cookies,
      getClearedCookies: () => clearedCookies,
    };
  }

  function createMockRequest(overrides = {}) {
    return {
      cookies: {},
      ...overrides,
    };
  }

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn().mockResolvedValue(mockTokens),
      refreshToken: jest
        .fn()
        .mockResolvedValue({ accessToken: 'new-access-token' }),
      logout: jest.fn().mockResolvedValue(undefined),
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

  describe('Login flow - POST /auth/login sets cookies', () => {
    it('should set access and refresh token cookies on successful login', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      const res = createMockResponse();

      const result = await controller.login(
        { email: 'test@example.com', password: 'MyStr0ng!Pass99' },
        res as any,
      );

      const cookies = res.getCookies();
      expect(cookies.length).toBeGreaterThanOrEqual(2);

      const accessCookie = cookies.find((c) => c.name === 'accessToken');
      const refreshCookie = cookies.find((c) => c.name === 'refreshToken');

      expect(accessCookie).toBeDefined();
      expect(accessCookie!.value).toBe('test-access-token');
      expect(accessCookie!.options.httpOnly).toBe(true);
      expect(accessCookie!.options.path).toBe('/');

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie!.value).toBe('test-refresh-token');
      expect(refreshCookie!.options.httpOnly).toBe(true);
    });

    it('should return user data in response body', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      const res = createMockResponse();

      const result = await controller.login(
        { email: 'test@example.com', password: 'MyStr0ng!Pass99' },
        res as any,
      );

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should set SameSite=lax on auth cookies', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      const res = createMockResponse();

      await controller.login(
        { email: 'test@example.com', password: 'MyStr0ng!Pass99' },
        res as any,
      );

      const cookies = res.getCookies();
      cookies.forEach((cookie) => {
        expect(cookie.options.sameSite).toBe('lax');
      });
    });

    it('should set refreshToken cookie path to /auth/refresh', async () => {
      (authService.validateUser as jest.Mock).mockResolvedValue(mockUser);
      const res = createMockResponse();

      await controller.login(
        { email: 'test@example.com', password: 'MyStr0ng!Pass99' },
        res as any,
      );

      const refreshCookie = res
        .getCookies()
        .find((c) => c.name === 'refreshToken');
      expect(refreshCookie!.options.path).toBe('/auth/refresh');
    });
  });

  describe('GET /auth/me - read auth from cookies', () => {
    it('should return user data when authenticated', () => {
      const req = { user: mockUser };
      const result = controller.getMe(req);

      expect(result).toEqual(mockUser);
      expect(result.id).toBe(1);
      expect(result.email).toBe('test@example.com');
    });

    it('should contain user fields id, name, email, role', () => {
      const req = { user: mockUser };
      const result = controller.getMe(req);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('role');
    });
  });

  describe('Refresh flow - POST /auth/refresh updates access cookie', () => {
    it('should return new access token and set cookie', async () => {
      const req = createMockRequest({
        cookies: { refreshToken: 'valid-refresh-token' },
      });
      const res = createMockResponse();

      const result = await controller.refresh(
        { refreshToken: 'valid-refresh-token' },
        req as any,
        res as any,
      );

      expect(result).toEqual({ message: 'Token atualizado com sucesso' });
      expect(authService.refreshToken).toHaveBeenCalledWith(
        'valid-refresh-token',
      );

      const accessCookie = res
        .getCookies()
        .find((c) => c.name === 'accessToken');
      expect(accessCookie).toBeDefined();
      expect(accessCookie!.value).toBe('new-access-token');
      expect(accessCookie!.options.httpOnly).toBe(true);
    });

    it('should read refresh token from cookie if not in body', async () => {
      const req = createMockRequest({
        cookies: { refreshToken: 'cookie-refresh-token' },
      });
      const res = createMockResponse();

      await controller.refresh(
        { refreshToken: '' },
        req as any,
        res as any,
      );

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'cookie-refresh-token',
      );
    });

    it('should reject when no refresh token available', async () => {
      const req = createMockRequest({ cookies: {} });
      const res = createMockResponse();

      await expect(
        controller.refresh({ refreshToken: '' }, req as any, res as any),
      ).rejects.toThrow();
    });
  });

  describe('Logout flow - POST /auth/logout clears cookies', () => {
    it('should call logout service and return success message', async () => {
      const req = { user: { id: 1 } };
      const res = createMockResponse();

      const result = await controller.logout(req, res as any);

      expect(result).toEqual({ message: 'Logout realizado com sucesso' });
      expect(authService.logout).toHaveBeenCalledWith(1);
    });

    it('should clear accessToken and refreshToken cookies', async () => {
      const req = { user: { id: 1 } };
      const res = createMockResponse();

      await controller.logout(req, res as any);

      const clearedCookies = res.getClearedCookies();
      const clearedNames = clearedCookies.map((c) => c.name);

      expect(clearedNames).toContain('accessToken');
      expect(clearedNames).toContain('refreshToken');
    });
  });

  describe('Expired token handling', () => {
    it('should reject expired refresh token', async () => {
      (authService.refreshToken as jest.Mock).mockRejectedValue(
        new Error('Token de atualização inválido'),
      );
      const req = createMockRequest({
        cookies: { refreshToken: 'expired-token' },
      });
      const res = createMockResponse();

      await expect(
        controller.refresh(
          { refreshToken: 'expired-token' },
          req as any,
          res as any,
        ),
      ).rejects.toThrow();
    });
  });
});

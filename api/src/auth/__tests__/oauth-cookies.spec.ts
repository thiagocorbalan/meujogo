import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('REQ-SEC-07: OAuth Token Delivery via HttpOnly Cookies', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;
  let originalNodeEnv: string | undefined;

  const mockLoginResult = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    user: {
      id: 1,
      name: 'OAuth User',
      email: 'oauth@test.com',
      role: 'USUARIO',
    },
  };

  beforeEach(async () => {
    originalNodeEnv = process.env.NODE_ENV;
    authService = {
      validateUser: jest.fn(),
      login: jest.fn().mockResolvedValue(mockLoginResult),
      refreshToken: jest.fn(),
      logout: jest.fn(),
      validateOAuthUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    jest.clearAllMocks();
  });

  function createMockResponse() {
    const cookies: Array<{
      name: string;
      value: string;
      options: Record<string, any>;
    }> = [];
    let redirectUrl = '';

    return {
      cookie: jest.fn((name: string, value: string, options: any) => {
        cookies.push({ name, value, options });
      }),
      clearCookie: jest.fn(),
      redirect: jest.fn((url: string) => {
        redirectUrl = url;
      }),
      getCookies: () => cookies,
      getRedirectUrl: () => redirectUrl,
    };
  }

  describe('Google OAuth callback', () => {
    it('should set HttpOnly cookies on Google callback', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const cookies = res.getCookies();
      expect(cookies.length).toBeGreaterThanOrEqual(2);

      const accessCookie = cookies.find((c) => c.name === 'accessToken');
      const refreshCookie = cookies.find((c) => c.name === 'refreshToken');

      expect(accessCookie).toBeDefined();
      expect(accessCookie!.options.httpOnly).toBe(true);
      expect(accessCookie!.value).toBe('test-access-token');

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie!.options.httpOnly).toBe(true);
      expect(refreshCookie!.value).toBe('test-refresh-token');
    });

    it('should NOT include tokens in the redirect URL', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const redirectUrl = res.getRedirectUrl();
      expect(redirectUrl).not.toContain('accessToken=');
      expect(redirectUrl).not.toContain('refreshToken=');
    });

    it('should redirect to /auth/callback without tokens', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const redirectUrl = res.getRedirectUrl();
      expect(redirectUrl).toContain('/auth/callback');
      expect(redirectUrl).not.toContain('?');
    });

    it('should set SameSite=lax on cookies', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const cookies = res.getCookies();
      cookies.forEach((cookie) => {
        expect(cookie.options.sameSite).toBe('lax');
      });
    });
  });

  describe('Apple OAuth callback', () => {
    it('should set HttpOnly cookies on Apple callback', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.appleCallback(req, res as any);

      const cookies = res.getCookies();
      expect(cookies.length).toBeGreaterThanOrEqual(2);

      const accessCookie = cookies.find((c) => c.name === 'accessToken');
      const refreshCookie = cookies.find((c) => c.name === 'refreshToken');

      expect(accessCookie).toBeDefined();
      expect(accessCookie!.options.httpOnly).toBe(true);

      expect(refreshCookie).toBeDefined();
      expect(refreshCookie!.options.httpOnly).toBe(true);
    });

    it('should NOT include tokens in the redirect URL', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.appleCallback(req, res as any);

      const redirectUrl = res.getRedirectUrl();
      expect(redirectUrl).not.toContain('accessToken=');
      expect(redirectUrl).not.toContain('refreshToken=');
    });
  });

  describe('Cookie security flags', () => {
    it('should set accessToken cookie path to /', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const accessCookie = res
        .getCookies()
        .find((c) => c.name === 'accessToken');
      expect(accessCookie!.options.path).toBe('/');
    });

    it('should set refreshToken cookie path to /auth/refresh', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const refreshCookie = res
        .getCookies()
        .find((c) => c.name === 'refreshToken');
      expect(refreshCookie!.options.path).toBe('/auth/refresh');
    });

    it('should set maxAge on access token (15 min)', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const accessCookie = res
        .getCookies()
        .find((c) => c.name === 'accessToken');
      expect(accessCookie!.options.maxAge).toBe(15 * 60 * 1000);
    });

    it('should set maxAge on refresh token (7 days default)', async () => {
      const req = { user: mockLoginResult.user };
      const res = createMockResponse();

      await controller.googleCallback(req, res as any);

      const refreshCookie = res
        .getCookies()
        .find((c) => c.name === 'refreshToken');
      expect(refreshCookie!.options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });
  });
});

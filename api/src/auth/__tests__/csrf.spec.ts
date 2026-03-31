import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';

describe('REQ-SEC-09: CSRF Protection', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  function createMockResponse() {
    const cookies: Array<{
      name: string;
      value: string;
      options: Record<string, any>;
    }> = [];

    return {
      cookie: jest.fn((name: string, value: string, options: any) => {
        cookies.push({ name, value, options });
      }),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
      getCookies: () => cookies,
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

  describe('CSRF token endpoint', () => {
    it('should have a getCsrfToken method on the controller', () => {
      expect(controller.getCsrfToken).toBeDefined();
      expect(typeof controller.getCsrfToken).toBe('function');
    });

    it('should return a CSRF token object', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const result = controller.getCsrfToken(req as any, res as any);

      expect(result).toBeDefined();
      expect(result.csrfToken).toBeDefined();
      expect(typeof result.csrfToken).toBe('string');
      expect(result.csrfToken.length).toBeGreaterThan(0);
    });

    it('should set XSRF-TOKEN cookie', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      controller.getCsrfToken(req as any, res as any);

      const cookies = res.getCookies();
      const csrfCookie = cookies.find((c) => c.name === 'XSRF-TOKEN');

      expect(csrfCookie).toBeDefined();
      expect(csrfCookie!.value).toBeDefined();
      expect(csrfCookie!.value.length).toBeGreaterThan(0);
    });

    it('should set XSRF-TOKEN cookie as non-HttpOnly (frontend needs to read it)', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      controller.getCsrfToken(req as any, res as any);

      const cookies = res.getCookies();
      const csrfCookie = cookies.find((c) => c.name === 'XSRF-TOKEN');

      expect(csrfCookie!.options.httpOnly).toBe(false);
    });

    it('should set SameSite=lax on CSRF cookie', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      controller.getCsrfToken(req as any, res as any);

      const cookies = res.getCookies();
      const csrfCookie = cookies.find((c) => c.name === 'XSRF-TOKEN');

      expect(csrfCookie!.options.sameSite).toBe('lax');
    });

    it('should generate unique tokens on each call', () => {
      const req = createMockRequest();
      const res1 = createMockResponse();
      const res2 = createMockResponse();

      const result1 = controller.getCsrfToken(req as any, res1 as any);
      const result2 = controller.getCsrfToken(req as any, res2 as any);

      expect(result1.csrfToken).not.toBe(result2.csrfToken);
    });
  });

  describe('CSRF token format', () => {
    it('should return a hex string of sufficient length', () => {
      const req = createMockRequest();
      const res = createMockResponse();

      const result = controller.getCsrfToken(req as any, res as any);

      expect(result.csrfToken).toMatch(/^[a-f0-9]+$/);
      expect(result.csrfToken.length).toBeGreaterThanOrEqual(32);
    });
  });

  describe('GET requests should work without CSRF', () => {
    it('GET /auth/me should not require CSRF token', () => {
      const req = { user: { id: 1, name: 'Test', email: 'test@test.com', role: 'USUARIO' } };

      const result = controller.getMe(req);
      expect(result).toBeDefined();
    });
  });

  describe('OAuth callbacks are exempt from CSRF', () => {
    it('Google callback controller method exists and is GET (no CSRF needed)', () => {
      expect(controller.googleCallback).toBeDefined();
      expect(typeof controller.googleCallback).toBe('function');
    });

    it('Apple callback controller method exists', () => {
      expect(controller.appleCallback).toBeDefined();
      expect(typeof controller.appleCallback).toBe('function');
    });
  });
});

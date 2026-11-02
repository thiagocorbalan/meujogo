import { ForbiddenException } from '@nestjs/common';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';

describe('SuperAdminGuard', () => {
  let guard: SuperAdminGuard;

  function createMockExecutionContext(user?: Record<string, any>) {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    };
  }

  beforeEach(() => {
    guard = new SuperAdminGuard();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true for user with isSuperAdmin=true', () => {
      const context = createMockExecutionContext({ id: 1, isSuperAdmin: true });

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException for user without isSuperAdmin', () => {
      const context = createMockExecutionContext({
        id: 2,
        isSuperAdmin: false,
      });

      expect(() => guard.canActivate(context as any)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException for user with isSuperAdmin=undefined', () => {
      const context = createMockExecutionContext({ id: 3 });

      expect(() => guard.canActivate(context as any)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when request has no user', () => {
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context as any)).toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException with correct message', () => {
      const context = createMockExecutionContext({
        id: 4,
        isSuperAdmin: false,
      });

      expect(() => guard.canActivate(context as any)).toThrow(
        'Acesso restrito ao superadmin',
      );
    });
  });
});

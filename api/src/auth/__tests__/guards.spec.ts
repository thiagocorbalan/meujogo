import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../common/guards/roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockContext = (userRole: string): ExecutionContext => {
    const mockRequest = { user: { role: userRole } };
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;

    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow access for correct role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext('ADMIN');

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access for insufficient role', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);
    const context = createMockContext('USUARIO');

    const result = guard.canActivate(context);

    expect(result).toBe(false);
  });

  it('should allow access when no roles required (no metadata)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext('USUARIO');

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });
});

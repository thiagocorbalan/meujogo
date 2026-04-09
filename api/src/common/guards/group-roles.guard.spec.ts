import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GroupRole, UserRole } from '@prisma/client';
import { GroupRolesGuard } from './group-roles.guard';
import { GROUP_ROLES_KEY, GroupRoles } from '../decorators/group-roles.decorator';

describe('GroupRolesGuard', () => {
  let guard: GroupRolesGuard;
  let reflector: { get: jest.Mock };

  function createMockExecutionContext(
    user: { role: UserRole } = { role: UserRole.USUARIO },
    groupContext?: { groupRole: GroupRole; groupId: number; userId: number; playerId: number | null },
  ) {
    const request: Record<string, any> = { user };
    if (groupContext !== undefined) {
      request.groupContext = groupContext;
    }

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    };
  }

  beforeEach(() => {
    reflector = { get: jest.fn() };
    guard = new GroupRolesGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when endpoint has @GroupRoles(DONO)', () => {
    it('should allow when user has groupRole DONO', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USUARIO },
        { groupRole: GroupRole.DONO, groupId: 1, userId: 1, playerId: 1 },
      );
      reflector.get.mockReturnValue([GroupRole.DONO]);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });

    it('should deny when user has groupRole ADMIN', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USUARIO },
        { groupRole: GroupRole.ADMIN, groupId: 1, userId: 1, playerId: 1 },
      );
      reflector.get.mockReturnValue([GroupRole.DONO]);

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });

    it('should deny when user has groupRole JOGADOR', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USUARIO },
        { groupRole: GroupRole.JOGADOR, groupId: 1, userId: 1, playerId: 1 },
      );
      reflector.get.mockReturnValue([GroupRole.DONO]);

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });
  });

  describe('when endpoint has @GroupRoles(DONO, ADMIN)', () => {
    it('should allow when user has groupRole ADMIN', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USUARIO },
        { groupRole: GroupRole.ADMIN, groupId: 1, userId: 1, playerId: 1 },
      );
      reflector.get.mockReturnValue([GroupRole.DONO, GroupRole.ADMIN]);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });
  });

  describe('when endpoint has no @GroupRoles decorator', () => {
    it('should allow all (return true, no restriction)', () => {
      const context = createMockExecutionContext(
        { role: UserRole.USUARIO },
        { groupRole: GroupRole.JOGADOR, groupId: 1, userId: 1, playerId: 1 },
      );
      reflector.get.mockReturnValue(undefined);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });
  });

  describe('when groupContext is not set on request', () => {
    it('should throw ForbiddenException for non-admin user', () => {
      const context = createMockExecutionContext({ role: UserRole.USUARIO });
      reflector.get.mockReturnValue([GroupRole.DONO]);

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });
  });

  describe('superadmin bypass (user.role === ADMIN from UserRole)', () => {
    it('should allow system ADMIN regardless of group role', () => {
      const context = createMockExecutionContext(
        { role: UserRole.ADMIN },
        { groupRole: GroupRole.JOGADOR, groupId: 1, userId: 1, playerId: 1 },
      );
      reflector.get.mockReturnValue([GroupRole.DONO]);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });

    it('should allow system ADMIN even without groupContext', () => {
      const context = createMockExecutionContext({ role: UserRole.ADMIN });
      reflector.get.mockReturnValue([GroupRole.DONO]);

      const result = guard.canActivate(context as any);

      expect(result).toBe(true);
    });
  });
});

describe('GroupRoles decorator', () => {
  it('should set GROUP_ROLES_KEY metadata with provided roles', () => {
    // The @GroupRoles decorator should use SetMetadata to store roles
    // under the GROUP_ROLES_KEY constant. We verify by applying it
    // to a test class method and reading the metadata back.
    const decorator = GroupRoles(GroupRole.DONO, GroupRole.ADMIN);

    // Create a test target to apply the decorator to
    const target = {};
    const propertyKey = 'testMethod';
    const descriptor = { value: () => {} };

    decorator(target, propertyKey, descriptor as any);

    // Read back the metadata using Reflect
    const metadata = Reflect.getMetadata(GROUP_ROLES_KEY, descriptor.value);
    expect(metadata).toEqual([GroupRole.DONO, GroupRole.ADMIN]);
  });

  it('should export GROUP_ROLES_KEY as "groupRoles"', () => {
    expect(GROUP_ROLES_KEY).toBe('groupRoles');
  });
});

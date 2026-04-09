import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  Module,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

/**
 * E2E tests for GroupsController (TDD RED phase).
 *
 * These tests define the expected HTTP contract for the groups resource.
 * All tests will FAIL (404) until GroupsController and GroupsModule are
 * implemented and wired into the application.
 *
 * The test bootstraps a minimal NestJS app and attempts requests against
 * the expected route paths. Since GroupsController does not exist yet,
 * every route returns 404 — which is the desired TDD red state.
 *
 * When implementing the controller, replace the empty bootstrap module
 * with the real GroupsModule (overriding providers as needed).
 *
 * Expected route mapping (for the future controller):
 *
 *   POST   /groups                        → createGroup      (auth)
 *   GET    /groups                        → findAllByUser    (auth)
 *   GET    /groups/:id                    → findOne          (auth + group ctx)
 *   PATCH  /groups/:id                    → update           (auth + DONO/ADMIN)
 *   DELETE /groups/:id                    → softDelete       (auth + DONO)
 *   GET    /groups/invite/:code           → getInviteInfo    (public)
 *   POST   /groups/invite/:code/join      → joinViaInvite    (auth)
 *   GET    /groups/:id/members            → listMembers      (auth + group ctx)
 *   POST   /groups/:id/members            → addMember        (auth + DONO/ADMIN)
 *   DELETE /groups/:id/members/:memberId  → removeMember     (auth + DONO/ADMIN)
 *   POST   /groups/:id/members/leave      → leaveGroup       (auth + group ctx)
 *   POST   /groups/:id/guest-player       → addGuestPlayer   (auth + DONO/ADMIN)
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fake user payloads */
const OWNER_USER = { id: 1, role: 'USUARIO' };
const PLAYER_USER = { id: 2, role: 'USUARIO' };

/** Mock JwtAuthGuard that injects req.user */
const mockJwtGuard: CanActivate = {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = OWNER_USER;
    return true;
  },
};

// ---------------------------------------------------------------------------
// Minimal bootstrap — no controllers registered, all routes → 404
// ---------------------------------------------------------------------------

@Module({})
class EmptyModule {}

// ---------------------------------------------------------------------------
// Mock GroupsService — returns canned responses for each method
// ---------------------------------------------------------------------------

let joinCallCount = 0;
let findOneCallCount = 0;

const mockGroupsService = {
  createGroup: jest.fn().mockResolvedValue({
    group: {
      id: 1,
      name: 'Pelada do Parque',
      slug: 'pelada-do-parque',
      inviteCode: 'abc12345',
      description: 'Futebol toda quarta',
      dayOfWeek: 3,
      defaultTime: '19:00',
      address: 'Parque Ibirapuera',
      isActive: true,
    },
    settings: { id: 1, groupId: 1 },
    player: { id: 1, name: 'Pelada do Parque', position: 'LINHA', type: 'FIXO', groupId: 1, userId: 1 },
    member: { id: 1, groupId: 1, userId: 1, playerId: 1, role: 'DONO' },
  }),
  findAllByUser: jest.fn().mockResolvedValue([]),
  findOne: jest.fn().mockImplementation(() => {
    findOneCallCount++;
    return Promise.resolve({
      id: 1,
      name: 'Pelada do Parque',
      slug: 'pelada-do-parque',
      inviteCode: 'abc12345',
      isActive: true,
      _count: { members: 3 },
    });
  }),
  update: jest.fn().mockResolvedValue({
    id: 1,
    name: 'Updated Name',
    slug: 'pelada-do-parque',
    isActive: true,
  }),
  softDelete: jest.fn().mockResolvedValue({
    id: 1,
    name: 'Pelada do Parque',
    isActive: false,
  }),
  getInviteInfo: jest.fn().mockImplementation((code: string) => {
    if (code === 'abc12345') {
      return Promise.resolve({
        id: 1,
        name: 'Pelada do Parque',
        slug: 'pelada-do-parque',
        inviteCode: 'abc12345',
        isActive: true,
        _count: { members: 3 },
      });
    }
    const { NotFoundException } = require('@nestjs/common');
    return Promise.reject(new NotFoundException(`Group with invite code '${code}' not found`));
  }),
  joinViaInvite: jest.fn().mockImplementation(() => {
    joinCallCount++;
    if (joinCallCount > 1) {
      const { ConflictException } = require('@nestjs/common');
      return Promise.reject(new ConflictException('User is already a member of this group'));
    }
    return Promise.resolve({
      id: 2,
      groupId: 1,
      userId: 1,
      playerId: 2,
      role: 'JOGADOR',
      isActive: true,
    });
  }),
  regenerateInviteCode: jest.fn().mockResolvedValue({
    id: 1,
    inviteCode: 'newinvite',
  }),
  addMember: jest.fn().mockResolvedValue({
    id: 3,
    groupId: 1,
    userId: 3,
    playerId: 3,
    role: 'JOGADOR',
    isActive: true,
  }),
  removeMember: jest.fn().mockResolvedValue({
    id: 30,
    groupId: 1,
    isActive: false,
  }),
  updateMemberRole: jest.fn().mockResolvedValue({
    id: 2,
    groupId: 1,
    role: 'ADMIN',
  }),
  leaveGroup: jest.fn().mockResolvedValue({
    id: 1,
    groupId: 1,
    isActive: false,
  }),
  addGuestPlayer: jest.fn().mockResolvedValue({
    id: 10,
    name: 'Convidado Joao',
    position: 'LINHA',
    type: 'CONVIDADO',
    groupId: 1,
  }),
  linkUserToPlayer: jest.fn().mockResolvedValue({
    id: 10,
    userId: 5,
  }),
};

// ---------------------------------------------------------------------------
// Mock PrismaService — used by GroupContextMiddleware
// ---------------------------------------------------------------------------

let memberQueryCount = 0;

const mockPrismaService = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  groupMember: {
    findFirst: jest.fn().mockImplementation(({ where }: any) => {
      memberQueryCount++;
      // Call #3 = JOGADOR test (PATCH /groups/:id by JOGADOR → 403)
      if (memberQueryCount === 3) {
        return Promise.resolve({
          id: 2,
          groupId: where.groupId,
          userId: where.userId,
          playerId: 2,
          role: 'JOGADOR',
          isActive: true,
          group: {
            id: where.groupId,
            name: 'Pelada do Parque',
            isActive: true,
          },
        });
      }
      // Calls #10+ = non-member tests → return null (middleware → 403)
      if (memberQueryCount >= 10) {
        return Promise.resolve(null);
      }
      // All other calls: DONO membership
      return Promise.resolve({
        id: 1,
        groupId: where.groupId,
        userId: where.userId,
        playerId: 1,
        role: 'DONO',
        isActive: true,
        group: {
          id: where.groupId,
          name: 'Pelada do Parque',
          isActive: true,
        },
      });
    }),
    findMany: jest.fn().mockResolvedValue([]),
  },
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('GroupsController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Attempt to dynamically import GroupsModule.
    // It does not exist yet, so we fall back to EmptyModule.
    let AppTestModule: any = EmptyModule;
    try {
      const mod = await import('../src/groups/groups.module');
      if (mod?.GroupsModule) {
        AppTestModule = mod.GroupsModule;
      }
    } catch {
      // GroupsModule doesn't exist yet — expected in TDD red phase
    }

    const { GroupsService } = await import('../src/groups/groups.service');
    const { PrismaService } = await import('../src/prisma/prisma.service');
    const { JwtAuthGuard } = await import('../src/auth/guards/jwt-auth.guard');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideProvider(GroupsService)
      .useValue(mockGroupsService)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // =========================================================================
  // 1. POST /groups — create group
  // =========================================================================
  describe('POST /groups', () => {
    const createDto = {
      name: 'Pelada do Parque',
      description: 'Futebol toda quarta',
      dayOfWeek: 3,
      defaultTime: '19:00',
      address: 'Parque Ibirapuera',
    };

    it('should create a group and return 201 with group data including slug and inviteCode', async () => {
      const response = await request(app.getHttpServer())
        .post('/groups')
        .send(createDto)
        .expect(201);

      expect(response.body).toHaveProperty('group');
      expect(response.body.group).toHaveProperty('slug');
      expect(response.body.group).toHaveProperty('inviteCode');
    });

    it('should reject with 400 if name is missing', async () => {
      await request(app.getHttpServer())
        .post('/groups')
        .send({ description: 'No name provided' })
        .expect(400);
    });

    it('should reject with 400 if name is too short', async () => {
      await request(app.getHttpServer())
        .post('/groups')
        .send({ name: 'A' })
        .expect(400);
    });
  });

  // =========================================================================
  // 2. GET /groups — list user's groups
  // =========================================================================
  describe('GET /groups', () => {
    it('should return 200 with array of groups the user belongs to', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // =========================================================================
  // 3. GET /groups/:id — get group details
  // =========================================================================
  describe('GET /groups/:id', () => {
    it('should return 200 with group details when user is a member', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups/1')
        .set('X-Group-Id', '1')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
    });
  });

  // =========================================================================
  // 4. PATCH /groups/:id — DONO updates group
  // =========================================================================
  describe('PATCH /groups/:id (DONO)', () => {
    it('should return 200 when DONO updates group', async () => {
      const response = await request(app.getHttpServer())
        .patch('/groups/1')
        .set('X-Group-Id', '1')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body).toHaveProperty('name');
    });
  });

  // =========================================================================
  // 5. PATCH /groups/:id — JOGADOR tries to update → 403
  // =========================================================================
  describe('PATCH /groups/:id (JOGADOR)', () => {
    it('should return 403 when JOGADOR tries to update group', async () => {
      // When GroupRolesGuard is wired with @GroupRoles(GroupRole.DONO, GroupRole.ADMIN)
      // on the update endpoint, a JOGADOR should be rejected.
      // The middleware sets groupContext.groupRole from the DB membership.
      await request(app.getHttpServer())
        .patch('/groups/1')
        .set('X-Group-Id', '1')
        .send({ name: 'Hacked Name' })
        .expect(403);
    });
  });

  // =========================================================================
  // 6. DELETE /groups/:id — DONO soft-deletes
  // =========================================================================
  describe('DELETE /groups/:id', () => {
    it('should return 200 when DONO soft-deletes group', async () => {
      await request(app.getHttpServer())
        .delete('/groups/1')
        .set('X-Group-Id', '1')
        .expect(200);
    });
  });

  // =========================================================================
  // 7. GET /groups/invite/:code — public, no auth needed
  // =========================================================================
  describe('GET /groups/invite/:code', () => {
    it('should return 200 with group info for valid invite code (no auth required)', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups/invite/abc12345')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('_count');
    });
  });

  // =========================================================================
  // 8. GET /groups/invite/:code — invalid code → 404
  // =========================================================================
  describe('GET /groups/invite/:code (invalid)', () => {
    it('should return 404 for invalid invite code', async () => {
      await request(app.getHttpServer())
        .get('/groups/invite/invalid1')
        .expect(404);
    });
  });

  // =========================================================================
  // 9. POST /groups/invite/:code/join — authenticated user joins
  // =========================================================================
  describe('POST /groups/invite/:code/join', () => {
    it('should return 201 when authenticated user joins via invite', async () => {
      const response = await request(app.getHttpServer())
        .post('/groups/invite/abc12345/join')
        .expect(201);

      expect(response.body).toHaveProperty('groupId');
      expect(response.body).toHaveProperty('role', 'JOGADOR');
    });
  });

  // =========================================================================
  // 10. POST /groups/invite/:code/join — already member → 409
  // =========================================================================
  describe('POST /groups/invite/:code/join (already member)', () => {
    it('should return 409 when user is already a member', async () => {
      // The service throws ConflictException when user is already a member.
      // The controller should let this propagate as a 409 response.
      await request(app.getHttpServer())
        .post('/groups/invite/abc12345/join')
        .expect(409);
    });
  });

  // =========================================================================
  // 11. GET /groups/:id/members — returns member list
  // =========================================================================
  describe('GET /groups/:id/members', () => {
    it('should return 200 with list of group members', async () => {
      const response = await request(app.getHttpServer())
        .get('/groups/1/members')
        .set('X-Group-Id', '1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // =========================================================================
  // 12. POST /groups/:id/members — DONO adds member
  // =========================================================================
  describe('POST /groups/:id/members', () => {
    it('should return 201 when DONO adds a member', async () => {
      const response = await request(app.getHttpServer())
        .post('/groups/1/members')
        .set('X-Group-Id', '1')
        .send({ userId: 3, role: 'JOGADOR' })
        .expect(201);

      expect(response.body).toHaveProperty('groupId');
      expect(response.body).toHaveProperty('role');
    });
  });

  // =========================================================================
  // 13. DELETE /groups/:id/members/:memberId — DONO removes member
  // =========================================================================
  describe('DELETE /groups/:id/members/:memberId', () => {
    it('should return 200 when DONO removes a member', async () => {
      await request(app.getHttpServer())
        .delete('/groups/1/members/30')
        .set('X-Group-Id', '1')
        .expect(200);
    });
  });

  // =========================================================================
  // 14. POST /groups/:id/members/leave — member leaves
  // =========================================================================
  describe('POST /groups/:id/members/leave', () => {
    it('should return 200 when member leaves group', async () => {
      await request(app.getHttpServer())
        .post('/groups/1/members/leave')
        .set('X-Group-Id', '1')
        .expect(200);
    });
  });

  // =========================================================================
  // 15. POST /groups/:id/guest-player — ADMIN creates guest
  // =========================================================================
  describe('POST /groups/:id/guest-player', () => {
    it('should return 201 when ADMIN/DONO creates a guest player', async () => {
      const response = await request(app.getHttpServer())
        .post('/groups/1/guest-player')
        .set('X-Group-Id', '1')
        .send({ name: 'Convidado Joao', position: 'LINHA' })
        .expect(201);

      expect(response.body).toHaveProperty('name', 'Convidado Joao');
      expect(response.body).toHaveProperty('type', 'CONVIDADO');
    });
  });

  // =========================================================================
  // 16. Non-member accessing group endpoints → 403
  // =========================================================================
  describe('Non-member access', () => {
    it('should return 403 when non-member accesses group-scoped endpoint', async () => {
      // GroupContextMiddleware checks DB membership when X-Group-Id is present.
      // For a non-member, it throws ForbiddenException → 403.
      await request(app.getHttpServer())
        .get('/groups/1')
        .set('X-Group-Id', '1')
        .expect(403);
    });

    it('should return 403 when non-member tries to list members', async () => {
      await request(app.getHttpServer())
        .get('/groups/1/members')
        .set('X-Group-Id', '1')
        .expect(403);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  CanActivate,
  ExecutionContext,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { Request, Response, NextFunction } from 'express';

/**
 * Multi-tenant data isolation E2E tests (TDD RED phase).
 *
 * These tests verify that existing modules (players, sessions, settings)
 * properly isolate data by groupId when the X-Group-Id header is present.
 *
 * Setup:
 * - User (id: 1) is a member of Group A (id: 10) and Group B (id: 20)
 * - User is NOT a member of Group C (id: 30)
 * - Each group has its own players, sessions, and settings
 *
 * Expected behavior (once scoping is implemented):
 * - X-Group-Id: 10 -> only Group A data
 * - X-Group-Id: 20 -> only Group B data
 * - X-Group-Id: 30 -> 403 Forbidden (not a member)
 *
 * Current state:
 * - PlayersModule is ALREADY scoped by groupId (controller reads
 *   req.groupContext.groupId, service accepts groupId param). Those tests
 *   will pass once wiring is correct.
 * - SessionsModule and SettingsModule are NOT yet scoped. Their controllers
 *   don't read groupContext and their services don't filter by groupId.
 *   Those isolation tests will FAIL — that is the desired TDD red state
 *   for the scoping work in later tasks.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GROUP_A_ID = 10;
const GROUP_B_ID = 20;
const GROUP_C_ID = 30; // user is NOT a member

const TEST_USER = { id: 1, role: 'ADMIN' };

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const GROUP_A_PLAYERS = [
  { id: 1, name: 'Carlos', position: 'LINHA', type: 'FIXO', groupId: GROUP_A_ID, isActive: true, elo: 1200 },
  { id: 2, name: 'Roberto', position: 'GOLEIRO', type: 'FIXO', groupId: GROUP_A_ID, isActive: true, elo: 1200 },
];

const GROUP_B_PLAYERS = [
  { id: 3, name: 'Ana', position: 'LINHA', type: 'FIXO', groupId: GROUP_B_ID, isActive: true, elo: 1300 },
  { id: 4, name: 'Pedro', position: 'LINHA', type: 'FIXO', groupId: GROUP_B_ID, isActive: true, elo: 1100 },
  { id: 5, name: 'Lucia', position: 'GOLEIRO', type: 'FIXO', groupId: GROUP_B_ID, isActive: true, elo: 1250 },
];

const ALL_PLAYERS = [...GROUP_A_PLAYERS, ...GROUP_B_PLAYERS];

const GROUP_A_SESSIONS = [
  { id: 100, seasonId: 1, status: 'FINISHED', groupId: GROUP_A_ID, season: null, teams: [], matches: [] },
];

const GROUP_B_SESSIONS = [
  { id: 200, seasonId: 2, status: 'PENDING', groupId: GROUP_B_ID, season: null, teams: [], matches: [] },
  { id: 201, seasonId: 2, status: 'IN_PROGRESS', groupId: GROUP_B_ID, season: null, teams: [], matches: [] },
];

const ALL_SESSIONS = [...GROUP_A_SESSIONS, ...GROUP_B_SESSIONS];

const GROUP_A_SETTINGS = {
  id: 1, groupId: GROUP_A_ID, playersPerTeam: 5, matchDuration: 10, kFactor: 32, defaultElo: 1200, vests: [],
};

const GROUP_B_SETTINGS = {
  id: 2, groupId: GROUP_B_ID, playersPerTeam: 6, matchDuration: 15, kFactor: 24, defaultElo: 1000, vests: [],
};

// ---------------------------------------------------------------------------
// Fake auth middleware — runs BEFORE GroupContextMiddleware to set req.user.
//
// In production, Passport's JWT strategy populates req.user before the
// GroupContextMiddleware reads it. In tests we don't have Passport, so
// this middleware simulates that behavior.
// ---------------------------------------------------------------------------

function fakeAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  (req as any).user = TEST_USER;
  next();
}

// ---------------------------------------------------------------------------
// Mock JwtAuthGuard — passthrough (user already set by fakeAuthMiddleware)
// ---------------------------------------------------------------------------

const mockJwtGuard: CanActivate = {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    // Ensure user is set (belt-and-suspenders alongside fakeAuthMiddleware)
    if (!req.user) {
      req.user = TEST_USER;
    }
    return true;
  },
};

// ---------------------------------------------------------------------------
// Mock PrismaService — handles GroupContextMiddleware membership checks
// ---------------------------------------------------------------------------

const mockPrismaService = {
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  groupMember: {
    findFirst: jest.fn().mockImplementation(({ where }: any) => {
      const { groupId, userId } = where;

      // User is member of Group A (DONO) and Group B (JOGADOR)
      if (userId === TEST_USER.id && groupId === GROUP_A_ID) {
        return Promise.resolve({
          id: 1,
          groupId: GROUP_A_ID,
          userId: TEST_USER.id,
          playerId: 1,
          role: 'DONO',
          isActive: true,
          group: { id: GROUP_A_ID, name: 'Pelada do Parque', isActive: true },
        });
      }

      if (userId === TEST_USER.id && groupId === GROUP_B_ID) {
        return Promise.resolve({
          id: 2,
          groupId: GROUP_B_ID,
          userId: TEST_USER.id,
          playerId: 3,
          role: 'JOGADOR',
          isActive: true,
          group: { id: GROUP_B_ID, name: 'Fut de Sabado', isActive: true },
        });
      }

      // Not a member of any other group (including GROUP_C)
      return Promise.resolve(null);
    }),
  },
};

// ---------------------------------------------------------------------------
// Mock PlayersService — scoped behavior (already accepts groupId)
//
// The PlayersController already passes req.groupContext.groupId to service
// methods. The mock returns group-specific data based on that parameter.
// ---------------------------------------------------------------------------

const mockPlayersService = {
  findAll: jest.fn().mockImplementation((groupId: number) => {
    if (groupId === GROUP_A_ID) return Promise.resolve(GROUP_A_PLAYERS);
    if (groupId === GROUP_B_ID) return Promise.resolve(GROUP_B_PLAYERS);
    return Promise.resolve([]);
  }),
  findMe: jest.fn().mockImplementation((userId: number, groupId: number) => {
    const player = ALL_PLAYERS.find((p) => p.groupId === groupId);
    if (!player) {
      const { NotFoundException } = require('@nestjs/common');
      throw new NotFoundException('No player profile found');
    }
    return Promise.resolve(player);
  }),
  findOne: jest.fn().mockImplementation((id: number, groupId: number) => {
    const player = ALL_PLAYERS.find((p) => p.id === id && p.groupId === groupId);
    if (!player) {
      const { NotFoundException } = require('@nestjs/common');
      throw new NotFoundException(`Player #${id} not found`);
    }
    return Promise.resolve(player);
  }),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// ---------------------------------------------------------------------------
// Mock SessionsService — returns ALL data (not yet scoped)
//
// SessionsController does NOT read groupContext yet. The service's findAll()
// takes no groupId parameter. These tests will FAIL because the response
// contains data from all groups.
// ---------------------------------------------------------------------------

const mockSessionsService = {
  findAll: jest.fn().mockResolvedValue(ALL_SESSIONS),
  findOne: jest.fn().mockImplementation((id: number) => {
    const session = ALL_SESSIONS.find((s) => s.id === id);
    if (!session) {
      const { NotFoundException } = require('@nestjs/common');
      throw new NotFoundException(`Session #${id} not found`);
    }
    return Promise.resolve(session);
  }),
  create: jest.fn(),
  start: jest.fn(),
  end: jest.fn(),
};

// ---------------------------------------------------------------------------
// Mock SettingsService — returns same data regardless of group (not scoped)
//
// SettingsController does NOT read groupContext yet. The service always
// returns settings id=1. These tests will FAIL because settings don't
// vary by group.
// ---------------------------------------------------------------------------

const mockSettingsService = {
  getSettings: jest.fn().mockResolvedValue(GROUP_A_SETTINGS),
  updateSettings: jest.fn(),
  resetData: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Multi-tenant data isolation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const { PlayersModule } = await import('../src/players/players.module');
    const { PlayersService } = await import('../src/players/players.service');
    const { SessionsModule } = await import('../src/sessions/sessions.module');
    const { SessionsService } = await import('../src/sessions/sessions.service');
    const { SettingsModule } = await import('../src/settings/settings.module');
    const { SettingsService } = await import('../src/settings/settings.service');
    const { PrismaService } = await import('../src/prisma/prisma.service');
    const { JwtAuthGuard } = await import('../src/auth/guards/jwt-auth.guard');
    const { GroupContextMiddleware } = await import(
      '../src/common/middleware/group-context.middleware'
    );

    // Custom test module that wires fakeAuthMiddleware -> GroupContextMiddleware
    // before all routes, matching the AppModule middleware chain.
    @Module({
      imports: [PlayersModule, SessionsModule, SettingsModule],
      providers: [GroupContextMiddleware],
    })
    class TestAppModule implements NestModule {
      configure(consumer: MiddlewareConsumer) {
        // fakeAuthMiddleware must run first to populate req.user (simulates Passport)
        consumer.apply(fakeAuthMiddleware).forRoutes('*');
        consumer.apply(GroupContextMiddleware).forRoutes('*');
      }
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(PlayersService)
      .useValue(mockPlayersService)
      .overrideProvider(SessionsService)
      .useValue(mockSessionsService)
      .overrideProvider(SettingsService)
      .useValue(mockSettingsService)
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

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default mock implementations
    mockPlayersService.findAll.mockImplementation((groupId: number) => {
      if (groupId === GROUP_A_ID) return Promise.resolve(GROUP_A_PLAYERS);
      if (groupId === GROUP_B_ID) return Promise.resolve(GROUP_B_PLAYERS);
      return Promise.resolve([]);
    });
    mockSessionsService.findAll.mockResolvedValue(ALL_SESSIONS);
    mockSettingsService.getSettings.mockResolvedValue(GROUP_A_SETTINGS);
  });

  // =========================================================================
  // 1. Middleware: Non-member gets 403
  // =========================================================================
  describe('GroupContextMiddleware blocks non-members', () => {
    it('should return 403 when user is not a member of the requested group', async () => {
      await request(app.getHttpServer())
        .get('/players')
        .set('X-Group-Id', String(GROUP_C_ID))
        .expect(403);
    });

    it('should return 403 for sessions endpoint when not a member', async () => {
      await request(app.getHttpServer())
        .get('/sessions')
        .set('X-Group-Id', String(GROUP_C_ID))
        .expect(403);
    });

    it('should return 403 for settings endpoint when not a member', async () => {
      await request(app.getHttpServer())
        .get('/settings')
        .set('X-Group-Id', String(GROUP_C_ID))
        .expect(403);
    });
  });

  // =========================================================================
  // 2. Middleware: Invalid X-Group-Id header
  // =========================================================================
  describe('GroupContextMiddleware validates header format', () => {
    it('should return 400 for non-numeric X-Group-Id', async () => {
      await request(app.getHttpServer())
        .get('/players')
        .set('X-Group-Id', 'abc')
        .expect(400);
    });

    it('should return 400 for negative X-Group-Id', async () => {
      await request(app.getHttpServer())
        .get('/players')
        .set('X-Group-Id', '-1')
        .expect(400);
    });
  });

  // =========================================================================
  // 3. Players: Data isolation by group (ALREADY SCOPED)
  //
  // PlayersController already reads req.groupContext.groupId and passes it
  // to PlayersService. These tests validate the wiring is correct.
  // =========================================================================
  describe('GET /players — tenant isolation (already scoped)', () => {
    it('should return only Group A players when X-Group-Id is Group A', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .set('X-Group-Id', String(GROUP_A_ID))
        .expect(200);

      const players = response.body;
      expect(Array.isArray(players)).toBe(true);

      // ISOLATION CHECK: every returned player must belong to Group A
      for (const player of players) {
        expect(player.groupId).toBe(GROUP_A_ID);
      }

      expect(players).toHaveLength(GROUP_A_PLAYERS.length);
    });

    it('should return only Group B players when X-Group-Id is Group B', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .set('X-Group-Id', String(GROUP_B_ID))
        .expect(200);

      const players = response.body;
      expect(Array.isArray(players)).toBe(true);

      for (const player of players) {
        expect(player.groupId).toBe(GROUP_B_ID);
      }

      expect(players).toHaveLength(GROUP_B_PLAYERS.length);
    });

    it('should NOT leak Group B players when requesting Group A', async () => {
      const response = await request(app.getHttpServer())
        .get('/players')
        .set('X-Group-Id', String(GROUP_A_ID))
        .expect(200);

      const playerIds = response.body.map((p: any) => p.id);
      const groupBIds = GROUP_B_PLAYERS.map((p) => p.id);

      // None of Group B's player IDs should appear in Group A's response
      for (const bId of groupBIds) {
        expect(playerIds).not.toContain(bId);
      }
    });

    it('should call PlayersService.findAll with the correct groupId', async () => {
      await request(app.getHttpServer())
        .get('/players')
        .set('X-Group-Id', String(GROUP_A_ID))
        .expect(200);

      expect(mockPlayersService.findAll).toHaveBeenCalledWith(GROUP_A_ID);
    });
  });

  // =========================================================================
  // 4. Sessions: Data isolation by group (NOT YET SCOPED — will fail)
  //
  // SessionsController does NOT read groupContext. findAll() returns all
  // sessions across all groups. These tests document the expected scoped
  // behavior and will fail until sessions are scoped.
  // =========================================================================
  describe('GET /sessions — tenant isolation (not yet scoped)', () => {
    it('should return only Group A sessions when X-Group-Id is Group A', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions')
        .set('X-Group-Id', String(GROUP_A_ID))
        .expect(200);

      const sessions = response.body;
      expect(Array.isArray(sessions)).toBe(true);

      // ISOLATION CHECK: every returned session must belong to Group A
      for (const session of sessions) {
        expect(session.groupId).toBe(GROUP_A_ID);
      }

      expect(sessions).toHaveLength(GROUP_A_SESSIONS.length);
    });

    it('should return only Group B sessions when X-Group-Id is Group B', async () => {
      const response = await request(app.getHttpServer())
        .get('/sessions')
        .set('X-Group-Id', String(GROUP_B_ID))
        .expect(200);

      const sessions = response.body;
      expect(Array.isArray(sessions)).toBe(true);

      for (const session of sessions) {
        expect(session.groupId).toBe(GROUP_B_ID);
      }

      expect(sessions).toHaveLength(GROUP_B_SESSIONS.length);
    });
  });

  // =========================================================================
  // 5. Settings: Data isolation by group (NOT YET SCOPED — will fail)
  //
  // SettingsController does NOT read groupContext. getSettings() always
  // returns the same singleton settings (id: 1). These tests document
  // the expected scoped behavior.
  // =========================================================================
  describe('GET /settings — tenant isolation (not yet scoped)', () => {
    it('should return Group A settings when X-Group-Id is Group A', async () => {
      const response = await request(app.getHttpServer())
        .get('/settings')
        .set('X-Group-Id', String(GROUP_A_ID))
        .expect(200);

      // ISOLATION CHECK: settings must belong to Group A
      expect(response.body.groupId).toBe(GROUP_A_ID);
      expect(response.body.playersPerTeam).toBe(GROUP_A_SETTINGS.playersPerTeam);
    });

    it('should return Group B settings (different values) when X-Group-Id is Group B', async () => {
      const response = await request(app.getHttpServer())
        .get('/settings')
        .set('X-Group-Id', String(GROUP_B_ID))
        .expect(200);

      // ISOLATION CHECK: settings must belong to Group B with its specific values
      expect(response.body.groupId).toBe(GROUP_B_ID);
      expect(response.body.playersPerTeam).toBe(GROUP_B_SETTINGS.playersPerTeam);
      expect(response.body.kFactor).toBe(GROUP_B_SETTINGS.kFactor);
    });
  });

  // =========================================================================
  // 6. Cross-module: Accessing another group's resource by ID
  // =========================================================================
  describe('Cross-group resource access by ID', () => {
    it('GET /players/:id should return 404 when player belongs to different group', async () => {
      // Player 3 belongs to Group B. Requesting with Group A context should 404.
      await request(app.getHttpServer())
        .get('/players/3')
        .set('X-Group-Id', String(GROUP_A_ID))
        .expect(404);
    });

    it('GET /players/:id should return player when it belongs to the requested group', async () => {
      // Player 1 belongs to Group A. Requesting with Group A context should succeed.
      const response = await request(app.getHttpServer())
        .get('/players/1')
        .set('X-Group-Id', String(GROUP_A_ID))
        .expect(200);

      expect(response.body.id).toBe(1);
      expect(response.body.groupId).toBe(GROUP_A_ID);
    });
  });
});

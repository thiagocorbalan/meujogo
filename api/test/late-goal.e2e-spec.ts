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
import { MatchesController } from '../src/matches/matches.controller.js';
import { MatchesService } from '../src/matches/matches.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard.js';
import { GroupRolesGuard } from '../src/common/guards/group-roles.guard.js';

const GROUP_ID = 1;
const TEST_USER = { id: 1, role: 'USUARIO' };

const mockJwtGuard: CanActivate = {
  canActivate(context: ExecutionContext): boolean {
    const req = context
      .switchToHttp()
      .getRequest<Request & { user: typeof TEST_USER }>();
    req.user = TEST_USER;
    return true;
  },
};

const mockRolesGuard: CanActivate = { canActivate: (): boolean => true };

interface InMemoryGoal {
  id: number;
  matchId: number;
  playerId: number | null;
  teamId: number;
  minute: number | null;
  source: 'LIVE' | 'LATE';
}

interface InMemoryEvent {
  id: number;
  matchId: number;
  type: string;
  goalId: number | null;
  payload: Record<string, unknown> | null;
}

interface InMemoryMatch {
  id: number;
  sessionId: number;
  teamAId: number;
  teamBId: number;
  scoreA: number;
  scoreB: number;
  winnerId: number | null;
  isDraw: boolean;
  matchOrder: number;
}

interface InMemorySession {
  id: number;
  groupId: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
}

function buildStore() {
  const session: InMemorySession = {
    id: 10,
    groupId: GROUP_ID,
    status: 'IN_PROGRESS',
  };
  const match: InMemoryMatch = {
    id: 100,
    sessionId: session.id,
    teamAId: 1,
    teamBId: 2,
    scoreA: 2,
    scoreB: 1,
    winnerId: 1,
    isDraw: false,
    matchOrder: 1,
  };
  const goals: InMemoryGoal[] = [];
  const events: InMemoryEvent[] = [
    {
      id: 1,
      matchId: match.id,
      type: 'MATCH_STARTED',
      goalId: null,
      payload: null,
    },
    {
      id: 2,
      matchId: match.id,
      type: 'MATCH_ENDED',
      goalId: null,
      payload: null,
    },
  ];
  let goalSeq = 0;
  let eventSeq = events.length;
  return {
    session,
    match,
    goals,
    events,
    nextGoalId: () => ++goalSeq,
    nextEventId: () => ++eventSeq,
  };
}

type Store = ReturnType<typeof buildStore>;

type LateGoalTx = {
  goal: { create: jest.Mock; delete: jest.Mock };
  matchEvent: { create: jest.Mock; deleteMany: jest.Mock };
  match: { update: jest.Mock };
};

function buildPrismaMock(store: Store) {
  const tx: LateGoalTx = {
    goal: {
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            matchId: number;
            playerId: number | null;
            teamId: number;
            source: 'LIVE' | 'LATE';
            minute: number | null;
          };
        }) => {
          const goal: InMemoryGoal = {
            id: store.nextGoalId(),
            matchId: data.matchId,
            playerId: data.playerId,
            teamId: data.teamId,
            source: data.source,
            minute: data.minute,
          };
          store.goals.push(goal);
          return Promise.resolve(goal);
        },
      ),
      delete: jest.fn(({ where }: { where: { id: number } }) => {
        const idx = store.goals.findIndex((g) => g.id === where.id);
        if (idx === -1) throw new Error('Goal not found');
        store.goals.splice(idx, 1);
        return Promise.resolve();
      }),
    },
    matchEvent: {
      create: jest.fn(({ data }: { data: Partial<InMemoryEvent> }) => {
        const event: InMemoryEvent = {
          id: store.nextEventId(),
          matchId: data.matchId ?? 0,
          type: data.type ?? 'LATE_GOAL_ADDED',
          goalId: data.goalId ?? null,
          payload: (data.payload as Record<string, unknown> | null) ?? null,
        };
        store.events.push(event);
        return Promise.resolve(event);
      }),
      deleteMany: jest.fn(
        ({ where }: { where: { matchId: number; goalId: number } }) => {
          const before = store.events.length;
          for (let i = store.events.length - 1; i >= 0; i -= 1) {
            const ev = store.events[i];
            if (ev?.matchId === where.matchId && ev.goalId === where.goalId) {
              store.events.splice(i, 1);
            }
          }
          return Promise.resolve({ count: before - store.events.length });
        },
      ),
    },
    match: {
      update: jest.fn(
        ({
          data,
        }: {
          data: {
            scoreA?: { increment?: number; decrement?: number };
            scoreB?: { increment?: number; decrement?: number };
          };
        }) => {
          if (data.scoreA?.increment)
            store.match.scoreA += data.scoreA.increment;
          if (data.scoreB?.increment)
            store.match.scoreB += data.scoreB.increment;
          if (data.scoreA?.decrement)
            store.match.scoreA -= data.scoreA.decrement;
          if (data.scoreB?.decrement)
            store.match.scoreB -= data.scoreB.decrement;
          return Promise.resolve(store.match);
        },
      ),
    },
  };

  const prisma = {
    match: {
      findFirst: jest.fn(() =>
        Promise.resolve({
          ...store.match,
          events: [...store.events],
          session: { ...store.session },
        }),
      ),
      findUnique: jest.fn(() =>
        Promise.resolve({ ...store.match, goals: [...store.goals] }),
      ),
    },
    goal: {
      findFirst: jest.fn(
        ({ where }: { where: { id: number; matchId: number } }) => {
          const g = store.goals.find(
            (x) => x.id === where.id && x.matchId === where.matchId,
          );
          return Promise.resolve(g ?? null);
        },
      ),
    },
    $transaction: jest.fn((cb: (txArg: LateGoalTx) => Promise<void>) => cb(tx)),
  };

  return { prisma, tx };
}

@Module({
  controllers: [MatchesController],
  providers: [MatchesService, { provide: PrismaService, useValue: {} }],
})
class TestMatchesModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: Request, _res: Response, next: NextFunction) => {
        (req as Request & { groupContext: { groupId: number } }).groupContext =
          {
            groupId: GROUP_ID,
          };
        next();
      })
      .forRoutes('*');
  }
}

describe('LateGoal e2e — REQ-2 validation', () => {
  let app: INestApplication<App>;
  let store: Store;
  let prismaMock: ReturnType<typeof buildPrismaMock>['prisma'];

  beforeEach(async () => {
    store = buildStore();
    prismaMock = buildPrismaMock(store).prisma;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestMatchesModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .overrideGuard(GroupRolesGuard)
      .useValue(mockRolesGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  function registerLateGoal(teamId: number, reason?: string) {
    return request(app.getHttpServer())
      .post(`/matches/${store.match.id}/late-goal`)
      .send({ teamId, ...(reason !== undefined ? { reason } : {}) });
  }

  function undoLateGoal(goalId: number) {
    return request(app.getHttpServer()).delete(
      `/matches/${store.match.id}/late-goal/${goalId}`,
    );
  }

  it('registers late goal, updates score, preserves historical winnerId', async () => {
    const winnerBefore = store.match.winnerId;
    const isDrawBefore = store.match.isDraw;

    const res = await registerLateGoal(2, 'gol esquecido');
    expect(res.status).toBe(201);

    expect(store.match.scoreB).toBe(2);
    expect(store.match.scoreA).toBe(2);
    expect(store.match.winnerId).toBe(winnerBefore);
    expect(store.match.isDraw).toBe(isDrawBefore);

    expect(store.goals).toHaveLength(1);
    const goal = store.goals[0]!;
    expect(goal.source).toBe('LATE');
    expect(goal.playerId).toBeNull();
    expect(goal.teamId).toBe(2);

    const event = store.events.find((e) => e.type === 'LATE_GOAL_ADDED');
    expect(event).toBeDefined();
    expect(event?.goalId).toBe(goal.id);
  });

  it('rejects late goal with 400 when session status is FINISHED', async () => {
    store.session.status = 'FINISHED';

    const res = await registerLateGoal(1);
    expect(res.status).toBe(400);
    expect(store.goals).toHaveLength(0);
  });

  it('rejects late goal with 400 when match has not ended yet', async () => {
    store.events = store.events.filter((e) => e.type !== 'MATCH_ENDED');

    const res = await registerLateGoal(1);
    expect(res.status).toBe(400);
    expect(store.goals).toHaveLength(0);
  });

  it('undoes a late goal: removes goal, event, decrements score', async () => {
    await registerLateGoal(1);
    const goal = store.goals[0]!;
    expect(store.match.scoreA).toBe(3);

    const res = await undoLateGoal(goal.id);
    expect(res.status).toBe(200);

    expect(store.goals).toHaveLength(0);
    expect(store.match.scoreA).toBe(2);
    expect(store.events.some((e) => e.type === 'LATE_GOAL_REMOVED')).toBe(true);
    expect(store.events.some((e) => e.type === 'LATE_GOAL_ADDED')).toBe(false);
  });
});

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

const mockRolesGuard: CanActivate = {
  canActivate(): boolean {
    return true;
  },
};

interface InMemoryGoal {
  id: number;
  matchId: number;
  playerId: number | null;
  teamId: number;
  minute: number | null;
  source: 'LIVE' | 'LATE';
  createdAt: Date;
}

interface InMemoryEvent {
  id: number;
  matchId: number;
  type: string;
  goalId: number | null;
  payload: Record<string, unknown> | null;
  timestamp: Date;
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

interface InMemoryPlayer {
  id: number;
  goals: number;
}

function buildStore() {
  const match: InMemoryMatch = {
    id: 100,
    sessionId: 10,
    teamAId: 1,
    teamBId: 2,
    scoreA: 0,
    scoreB: 0,
    winnerId: null,
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
      timestamp: new Date(),
    },
  ];

  const players = new Map<number, InMemoryPlayer>([
    [5, { id: 5, goals: 0 }],
    [6, { id: 6, goals: 0 }],
  ]);

  let goalSeq = 0;
  let eventSeq = events.length;

  return {
    match,
    goals,
    events,
    players,
    nextGoalId: () => ++goalSeq,
    nextEventId: () => ++eventSeq,
  };
}

type UndoGoalTx = {
  goal: { delete: jest.Mock };
  matchEvent: { deleteMany: jest.Mock; create: jest.Mock };
  match: { update: jest.Mock; findUnique: jest.Mock };
  player: { update: jest.Mock };
};

function buildPrismaMock(store: ReturnType<typeof buildStore>) {
  const tx: UndoGoalTx = {
    goal: {
      delete: jest.fn(({ where }: { where: { id: number } }) => {
        const idx = store.goals.findIndex((g) => g.id === where.id);
        if (idx === -1) throw new Error('Goal not found');
        store.goals.splice(idx, 1);
        return Promise.resolve();
      }),
    },
    matchEvent: {
      deleteMany: jest.fn(
        ({ where }: { where: { matchId: number; goalId: number } }) => {
          const before = store.events.length;
          for (let i = store.events.length - 1; i >= 0; i -= 1) {
            const ev = store.events[i];
            if (ev && ev.matchId === where.matchId && ev.goalId === where.goalId) {
              store.events.splice(i, 1);
            }
          }
          return Promise.resolve({ count: before - store.events.length });
        },
      ),
      create: jest.fn(({ data }: { data: Partial<InMemoryEvent> }) => {
        const event: InMemoryEvent = {
          id: store.nextEventId(),
          matchId: data.matchId ?? 0,
          type: data.type ?? 'GOAL_SCORED',
          goalId: data.goalId ?? null,
          payload: data.payload ?? null,
          timestamp: new Date(),
        };
        store.events.push(event);
        return Promise.resolve(event);
      }),
    },
    match: {
      update: jest.fn(
        ({
          data,
        }: {
          data: {
            scoreA?: { decrement: number };
            scoreB?: { decrement: number };
          };
        }) => {
          if (data.scoreA?.decrement)
            store.match.scoreA -= data.scoreA.decrement;
          if (data.scoreB?.decrement)
            store.match.scoreB -= data.scoreB.decrement;
          return Promise.resolve(store.match);
        },
      ),
      findUnique: jest.fn(() =>
        Promise.resolve({ ...store.match, goals: [...store.goals] }),
      ),
    },
    player: {
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: { goals: { decrement: number } };
        }) => {
          const p = store.players.get(where.id);
          if (p) p.goals -= data.goals.decrement;
          return Promise.resolve(p);
        },
      ),
    },
  };

  const prisma = {
    match: {
      findFirst: jest.fn(() =>
        Promise.resolve({ ...store.match, events: [...store.events] }),
      ),
      update: jest.fn(
        ({
          data,
        }: {
          data: {
            scoreA?: { increment: number };
            scoreB?: { increment: number };
          };
        }) => {
          if (data.scoreA?.increment)
            store.match.scoreA += data.scoreA.increment;
          if (data.scoreB?.increment)
            store.match.scoreB += data.scoreB.increment;
          return Promise.resolve(store.match);
        },
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
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            matchId: number;
            playerId: number;
            teamId: number;
            minute?: number | null;
          };
        }) => {
          const goal: InMemoryGoal = {
            id: store.nextGoalId(),
            matchId: data.matchId,
            playerId: data.playerId,
            teamId: data.teamId,
            minute: data.minute ?? null,
            source: 'LIVE',
            createdAt: new Date(),
          };
          store.goals.push(goal);
          return Promise.resolve(goal);
        },
      ),
    },
    matchEvent: {
      create: jest.fn(({ data }: { data: Partial<InMemoryEvent> }) => {
        const event: InMemoryEvent = {
          id: store.nextEventId(),
          matchId: data.matchId ?? 0,
          type: data.type ?? 'GOAL_SCORED',
          goalId: data.goalId ?? null,
          payload: data.payload ?? null,
          timestamp: new Date(),
        };
        store.events.push(event);
        return Promise.resolve(event);
      }),
    },
    player: {
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: { goals: { increment: number } };
        }) => {
          const p = store.players.get(where.id);
          if (p) p.goals += data.goals.increment;
          return Promise.resolve(p);
        },
      ),
    },
    $transaction: jest.fn((cb: (txArg: UndoGoalTx) => Promise<void>) => cb(tx)),
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
          { groupId: GROUP_ID };
        next();
      })
      .forRoutes('*');
  }
}

describe('UndoGoal e2e — bug fix validation', () => {
  let app: INestApplication<App>;
  let store: ReturnType<typeof buildStore>;
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

  async function scoreGoal(playerId: number, teamId: number) {
    return request(app.getHttpServer())
      .patch(`/matches/${store.match.id}/goal`)
      .send({ playerId, teamId, minute: null });
  }

  async function undoGoal(goalId: number) {
    return request(app.getHttpServer()).delete(
      `/matches/${store.match.id}/goal/${goalId}`,
    );
  }

  it('undoing middle goal removes only that goal and event (the bug fix)', async () => {
    await scoreGoal(5, 1);
    await scoreGoal(5, 1);
    await scoreGoal(5, 1);

    expect(store.goals).toHaveLength(3);
    expect(store.events.filter((e) => e.type === 'GOAL_SCORED')).toHaveLength(
      3,
    );
    expect(store.match.scoreA).toBe(3);
    expect(store.players.get(5)?.goals).toBe(3);

    const middleGoalId = store.goals[1]!.id;

    const res = await undoGoal(middleGoalId);
    expect(res.status).toBe(200);

    expect(store.goals).toHaveLength(2);
    expect(store.goals.find((g) => g.id === middleGoalId)).toBeUndefined();

    const remainingGoalEvents = store.events.filter(
      (e) => e.type === 'GOAL_SCORED',
    );
    expect(remainingGoalEvents).toHaveLength(2);
    expect(remainingGoalEvents.every((e) => e.goalId !== middleGoalId)).toBe(
      true,
    );

    expect(store.match.scoreA).toBe(2);
    expect(store.players.get(5)?.goals).toBe(2);
  });

  it('rejects undoGoal with 400 when match has already ended', async () => {
    await scoreGoal(5, 1);
    const goalId = store.goals[0]!.id;

    store.events.push({
      id: store.nextEventId(),
      matchId: store.match.id,
      type: 'MATCH_ENDED',
      goalId: null,
      payload: null,
      timestamp: new Date(),
    });

    const res = await undoGoal(goalId);
    expect(res.status).toBe(400);
    expect(store.goals).toHaveLength(1);
  });

  it('rejects undoGoal with 404 when goal does not exist', async () => {
    const res = await undoGoal(9999);
    expect(res.status).toBe(404);
  });

  it('allows undoing the first goal (not just the last)', async () => {
    await scoreGoal(5, 1);
    await scoreGoal(6, 1);
    await scoreGoal(5, 1);

    const firstGoalId = store.goals[0]!.id;
    const res = await undoGoal(firstGoalId);
    expect(res.status).toBe(200);

    expect(store.goals).toHaveLength(2);
    expect(store.goals.find((g) => g.id === firstGoalId)).toBeUndefined();
    expect(store.match.scoreA).toBe(2);
  });
});

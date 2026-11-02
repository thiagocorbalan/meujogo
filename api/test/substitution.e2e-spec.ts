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
import { SubstitutionsController } from '../src/substitutions/substitutions.controller.js';
import { SubstitutionsService } from '../src/substitutions/substitutions.service.js';
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

interface InMemorySubstitution {
  id: number;
  sessionId: number;
  matchId: number | null;
  teamId: number;
  sourceTeamId: number | null;
  playerOutId: number;
  playerInId: number;
  type: 'TEMPORARIA' | 'PERMANENTE';
  reason: 'LESAO' | 'CANSACO' | 'SEM_MOTIVO';
  minute: number | null;
  isReverted: boolean;
  revertedAt: Date | null;
  createdAt: Date;
}

interface InMemoryAttendance {
  playerId: number;
  sessionId: number;
  status: 'ATIVO' | 'RESERVA' | 'LESIONADO' | 'AUSENTE';
}

interface InMemoryTeamPlayer {
  teamId: number;
  playerId: number;
}

interface InMemoryMatchPlayer {
  matchId: number;
  playerId: number;
  teamId: number;
  isStarter: boolean;
  enteredMinute: number | null;
  leftMinute: number | null;
}

interface InMemoryTeam {
  id: number;
  name: string;
  color: string;
  sessionId: number;
}

function buildStore() {
  const session = { id: 10, groupId: GROUP_ID, status: 'IN_PROGRESS' as const };
  const teamA: InMemoryTeam = {
    id: 1,
    name: 'Brancos',
    color: '#fff',
    sessionId: session.id,
  };
  const teamB: InMemoryTeam = {
    id: 2,
    name: 'Pretos',
    color: '#000',
    sessionId: session.id,
  };
  const teamC: InMemoryTeam = {
    id: 3,
    name: 'Azuis',
    color: '#00f',
    sessionId: session.id,
  };
  const match = {
    id: 100,
    sessionId: session.id,
    teamAId: teamA.id,
    teamBId: teamB.id,
    scoreA: 0,
    scoreB: 0,
    matchOrder: 2,
  };
  const teamPlayers: InMemoryTeamPlayer[] = [
    { teamId: teamA.id, playerId: 11 },
    { teamId: teamA.id, playerId: 12 },
    { teamId: teamB.id, playerId: 21 },
    { teamId: teamB.id, playerId: 22 },
    { teamId: teamC.id, playerId: 31 },
    { teamId: teamC.id, playerId: 32 },
  ];
  const attendances: InMemoryAttendance[] = [
    { playerId: 11, sessionId: session.id, status: 'ATIVO' },
    { playerId: 12, sessionId: session.id, status: 'ATIVO' },
    { playerId: 21, sessionId: session.id, status: 'ATIVO' },
    { playerId: 22, sessionId: session.id, status: 'ATIVO' },
    { playerId: 31, sessionId: session.id, status: 'ATIVO' },
    { playerId: 32, sessionId: session.id, status: 'ATIVO' },
    { playerId: 99, sessionId: session.id, status: 'RESERVA' },
  ];
  const matchPlayers: InMemoryMatchPlayer[] = [
    {
      matchId: match.id,
      playerId: 11,
      teamId: teamA.id,
      isStarter: true,
      enteredMinute: null,
      leftMinute: null,
    },
    {
      matchId: match.id,
      playerId: 12,
      teamId: teamA.id,
      isStarter: true,
      enteredMinute: null,
      leftMinute: null,
    },
    {
      matchId: match.id,
      playerId: 21,
      teamId: teamB.id,
      isStarter: true,
      enteredMinute: null,
      leftMinute: null,
    },
    {
      matchId: match.id,
      playerId: 22,
      teamId: teamB.id,
      isStarter: true,
      enteredMinute: null,
      leftMinute: null,
    },
  ];
  const substitutions: InMemorySubstitution[] = [];
  const events: { type: string }[] = [];
  let subSeq = 0;
  return {
    session,
    teams: [teamA, teamB, teamC],
    teamPlayers,
    attendances,
    matchPlayers,
    substitutions,
    match,
    events,
    nextSubId: () => ++subSeq,
  };
}

type Store = ReturnType<typeof buildStore>;

type SubstitutionTx = {
  substitution: { create: jest.Mock; update: jest.Mock };
  matchPlayer: {
    updateMany: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  teamPlayer: { deleteMany: jest.Mock; create: jest.Mock };
  attendance: { updateMany: jest.Mock };
  matchEvent: { create: jest.Mock };
};

function buildPrismaMock(store: Store) {
  const tx: SubstitutionTx = {
    substitution: {
      create: jest.fn(
        ({
          data,
        }: {
          data: Omit<
            InMemorySubstitution,
            'id' | 'isReverted' | 'revertedAt' | 'createdAt'
          >;
        }) => {
          const sub: InMemorySubstitution = {
            id: store.nextSubId(),
            sessionId: data.sessionId,
            matchId: data.matchId,
            teamId: data.teamId,
            sourceTeamId: data.sourceTeamId,
            playerOutId: data.playerOutId,
            playerInId: data.playerInId,
            type: data.type,
            reason: data.reason,
            minute: data.minute,
            isReverted: false,
            revertedAt: null,
            createdAt: new Date(),
          };
          store.substitutions.push(sub);
          return Promise.resolve(sub);
        },
      ),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: { isReverted?: boolean; revertedAt?: Date };
        }) => {
          const sub = store.substitutions.find((s) => s.id === where.id);
          if (sub && data.isReverted !== undefined)
            sub.isReverted = data.isReverted;
          if (sub && data.revertedAt !== undefined)
            sub.revertedAt = data.revertedAt;
          return Promise.resolve(sub);
        },
      ),
    },
    matchPlayer: {
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: { matchId: number; playerId: number };
          data: { leftMinute: number | null };
        }) => {
          const mp = store.matchPlayers.find(
            (m) => m.matchId === where.matchId && m.playerId === where.playerId,
          );
          if (mp) mp.leftMinute = data.leftMinute;
          return Promise.resolve({ count: mp ? 1 : 0 });
        },
      ),
      create: jest.fn(({ data }: { data: InMemoryMatchPlayer }) => {
        store.matchPlayers.push(data);
        return Promise.resolve(data);
      }),
      deleteMany: jest.fn(
        ({ where }: { where: { matchId: number; playerId: number } }) => {
          const before = store.matchPlayers.length;
          for (let i = store.matchPlayers.length - 1; i >= 0; i -= 1) {
            const mp = store.matchPlayers[i];
            if (
              mp?.matchId === where.matchId &&
              mp.playerId === where.playerId
            ) {
              store.matchPlayers.splice(i, 1);
            }
          }
          return Promise.resolve({ count: before - store.matchPlayers.length });
        },
      ),
    },
    teamPlayer: {
      deleteMany: jest.fn(
        ({ where }: { where: { teamId: number; playerId: number } }) => {
          const before = store.teamPlayers.length;
          for (let i = store.teamPlayers.length - 1; i >= 0; i -= 1) {
            const tp = store.teamPlayers[i];
            if (tp?.teamId === where.teamId && tp.playerId === where.playerId) {
              store.teamPlayers.splice(i, 1);
            }
          }
          return Promise.resolve({ count: before - store.teamPlayers.length });
        },
      ),
      create: jest.fn(({ data }: { data: InMemoryTeamPlayer }) => {
        store.teamPlayers.push(data);
        return Promise.resolve(data);
      }),
    },
    attendance: {
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: { sessionId: number; playerId: number };
          data: { status: InMemoryAttendance['status'] };
        }) => {
          const a = store.attendances.find(
            (x) =>
              x.sessionId === where.sessionId && x.playerId === where.playerId,
          );
          if (a) a.status = data.status;
          return Promise.resolve({ count: a ? 1 : 0 });
        },
      ),
    },
    matchEvent: {
      create: jest.fn(({ data }: { data: { type: string } }) => {
        store.events.push({ type: data.type });
        return Promise.resolve({});
      }),
    },
  };

  const prisma = {
    session: {
      findFirst: jest.fn(
        ({ where }: { where: { id: number; groupId: number } }) => {
          if (
            where.id === store.session.id &&
            where.groupId === store.session.groupId
          ) {
            return Promise.resolve(store.session);
          }
          return Promise.resolve(null);
        },
      ),
    },
    match: {
      findFirst: jest.fn(() =>
        Promise.resolve({
          ...store.match,
          events: [{ type: 'MATCH_STARTED' }],
        }),
      ),
      findMany: jest.fn(() => Promise.resolve([])),
    },
    attendance: {
      findFirst: jest.fn(
        ({ where }: { where: { sessionId: number; playerId: number } }) => {
          const a = store.attendances.find(
            (x) =>
              x.sessionId === where.sessionId && x.playerId === where.playerId,
          );
          return Promise.resolve(a ?? null);
        },
      ),
      findMany: jest.fn(
        ({ where }: { where: { sessionId: number; status: string } }) => {
          return Promise.resolve(
            store.attendances
              .filter(
                (a) =>
                  a.sessionId === where.sessionId && a.status === where.status,
              )
              .map((a) => ({
                ...a,
                player: { id: a.playerId, name: `P${a.playerId}` },
              })),
          );
        },
      ),
    },
    teamPlayer: {
      findFirst: jest.fn(
        ({
          where,
        }: {
          where: {
            playerId: number;
            teamId?: { in: number[] };
            team?: { sessionId: number };
          };
        }) => {
          if (where.teamId?.in) {
            const tp = store.teamPlayers.find(
              (x) =>
                x.playerId === where.playerId &&
                where.teamId!.in.includes(x.teamId),
            );
            return Promise.resolve(tp ?? null);
          }
          if (where.team?.sessionId) {
            const tp = store.teamPlayers.find(
              (x) => x.playerId === where.playerId,
            );
            return Promise.resolve(tp ?? null);
          }
          return Promise.resolve(null);
        },
      ),
    },
    team: {
      findMany: jest.fn(() => {
        return Promise.resolve(
          store.teams.map((t) => ({
            ...t,
            players: store.teamPlayers
              .filter((tp) => tp.teamId === t.id)
              .map((tp) => ({
                player: { id: tp.playerId, name: `P${tp.playerId}` },
              })),
          })),
        );
      }),
    },
    substitution: {
      findFirst: jest.fn(
        ({ where }: { where: { id: number; sessionId: number } }) => {
          const sub = store.substitutions.find(
            (s) => s.id === where.id && s.sessionId === where.sessionId,
          );
          return Promise.resolve(sub ?? null);
        },
      ),
      findMany: jest.fn(() => Promise.resolve([...store.substitutions])),
    },
    $transaction: jest.fn((cb: (txArg: SubstitutionTx) => Promise<unknown>) => cb(tx)),
  };

  return { prisma, tx };
}

@Module({
  controllers: [SubstitutionsController],
  providers: [SubstitutionsService, { provide: PrismaService, useValue: {} }],
})
class TestSubstitutionsModule implements NestModule {
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

describe('Substitution e2e — REQ-3 / REQ-4 validation', () => {
  let app: INestApplication<App>;
  let store: Store;
  let prismaMock: ReturnType<typeof buildPrismaMock>['prisma'];

  beforeEach(async () => {
    store = buildStore();
    prismaMock = buildPrismaMock(store).prisma;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestSubstitutionsModule],
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

  it('POST /sessions/:id/substitutions creates TEMPORARIA by cansaco', async () => {
    const res = await request(app.getHttpServer())
      .post('/sessions/10/substitutions')
      .send({
        teamId: 1,
        playerOutId: 11,
        playerInId: 99,
        type: 'TEMPORARIA',
        reason: 'CANSACO',
        minute: 5,
      });

    expect(res.status).toBe(201);
    expect(store.substitutions).toHaveLength(1);
    expect(store.substitutions[0]?.type).toBe('TEMPORARIA');
    expect(store.substitutions[0]?.reason).toBe('CANSACO');
    const outAttendance = store.attendances.find((a) => a.playerId === 11);
    expect(outAttendance?.status).toBe('RESERVA');
    const inAttendance = store.attendances.find((a) => a.playerId === 99);
    expect(inAttendance?.status).toBe('ATIVO');
  });

  it('POST PERMANENTE by lesao with source team removes from source TeamPlayer', async () => {
    const res = await request(app.getHttpServer())
      .post('/sessions/10/substitutions')
      .send({
        teamId: 1,
        playerOutId: 11,
        playerInId: 31,
        type: 'PERMANENTE',
        reason: 'LESAO',
      });

    expect(res.status).toBe(201);
    expect(
      store.teamPlayers.find((tp) => tp.playerId === 31 && tp.teamId === 1),
    ).toBeDefined();
    expect(
      store.teamPlayers.find((tp) => tp.playerId === 31 && tp.teamId === 3),
    ).toBeUndefined();
    const outAttendance = store.attendances.find((a) => a.playerId === 11);
    expect(outAttendance?.status).toBe('LESIONADO');
  });

  it('GET /sessions/:id/substitutions/pool returns reserves and waiting teams', async () => {
    const res = await request(app.getHttpServer()).get(
      '/sessions/10/substitutions/pool',
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.reserves)).toBe(true);
    expect(Array.isArray(res.body.waitingTeams)).toBe(true);
    expect(res.body.waitingTeams.length).toBe(1);
    expect(res.body.waitingTeams[0].team.id).toBe(3);
  });

  it('DELETE substitution undoes TEMPORARIA and restores attendance', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/sessions/10/substitutions')
      .send({
        teamId: 1,
        playerOutId: 11,
        playerInId: 99,
        type: 'TEMPORARIA',
        reason: 'CANSACO',
        minute: 5,
      });
    const subId = createRes.body.id;

    const undoRes = await request(app.getHttpServer()).delete(
      `/sessions/10/substitutions/${subId}`,
    );
    expect(undoRes.status).toBe(200);
    const sub = store.substitutions.find((s) => s.id === subId);
    expect(sub?.isReverted).toBe(true);
    const outAttendance = store.attendances.find((a) => a.playerId === 11);
    expect(outAttendance?.status).toBe('ATIVO');
  });
});

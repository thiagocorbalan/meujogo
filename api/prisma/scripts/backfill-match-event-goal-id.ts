import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

type GoalKey = string;

function keyOf(matchId: number, playerId: number | null, teamId: number | null): GoalKey {
  return `${matchId}:${playerId ?? 'null'}:${teamId ?? 'null'}`;
}

async function main() {
  const events = await prisma.matchEvent.findMany({
    where: { type: 'GOAL_SCORED', goalId: null },
    orderBy: [{ matchId: 'asc' }, { timestamp: 'asc' }],
  });

  if (events.length === 0) {
    console.log('No GOAL_SCORED events pending backfill.');
    return;
  }

  const matchIds = Array.from(new Set(events.map((e) => e.matchId)));

  const goals = await prisma.goal.findMany({
    where: { matchId: { in: matchIds } },
    orderBy: [{ matchId: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  const goalsByKey = new Map<GoalKey, { id: number }[]>();
  for (const goal of goals) {
    const key = keyOf(goal.matchId, goal.playerId, goal.teamId);
    const list = goalsByKey.get(key) ?? [];
    list.push({ id: goal.id });
    goalsByKey.set(key, list);
  }

  let backfilled = 0;
  let unmatched = 0;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    for (const event of events) {
      const payload = (event.payload ?? {}) as Record<string, unknown>;
      const playerIdRaw = payload.playerId;
      const teamIdRaw = payload.teamId;
      const playerId = typeof playerIdRaw === 'number' ? playerIdRaw : null;
      const teamId = typeof teamIdRaw === 'number' ? teamIdRaw : null;

      const key = keyOf(event.matchId, playerId, teamId);
      const candidates = goalsByKey.get(key) ?? [];
      const next = candidates.shift();

      if (!next) {
        unmatched += 1;
        continue;
      }

      await tx.matchEvent.update({
        where: { id: event.id },
        data: { goalId: next.id },
      });
      backfilled += 1;
    }
  });

  console.log(`Backfilled goalId on ${backfilled} MatchEvent(s).`);
  if (unmatched > 0) {
    console.warn(`Could not correlate ${unmatched} GOAL_SCORED event(s) to a Goal record.`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

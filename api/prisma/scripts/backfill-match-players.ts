import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const matches = await prisma.match.findMany({
    select: {
      id: true,
      teamAId: true,
      teamBId: true,
      matchPlayers: { select: { id: true } },
    },
    orderBy: { id: 'asc' },
  });

  const pending = matches.filter((m) => m.matchPlayers.length === 0);

  if (pending.length === 0) {
    console.log('No matches pending MatchPlayer backfill.');
    return;
  }

  const teamIds = Array.from(
    new Set(pending.flatMap((m) => [m.teamAId, m.teamBId])),
  );

  const teamPlayers = await prisma.teamPlayer.findMany({
    where: { teamId: { in: teamIds } },
    select: { teamId: true, playerId: true },
  });

  const byTeam = new Map<number, number[]>();
  for (const tp of teamPlayers) {
    const list = byTeam.get(tp.teamId) ?? [];
    list.push(tp.playerId);
    byTeam.set(tp.teamId, list);
  }

  let created = 0;

  for (const match of pending) {
    const rows: {
      matchId: number;
      playerId: number;
      teamId: number;
      isStarter: boolean;
    }[] = [];

    for (const playerId of byTeam.get(match.teamAId) ?? []) {
      rows.push({ matchId: match.id, playerId, teamId: match.teamAId, isStarter: true });
    }
    for (const playerId of byTeam.get(match.teamBId) ?? []) {
      rows.push({ matchId: match.id, playerId, teamId: match.teamBId, isStarter: true });
    }

    if (rows.length === 0) continue;

    const result = await prisma.matchPlayer.createMany({
      data: rows,
      skipDuplicates: true,
    });
    created += result.count;
  }

  console.log(`Created ${created} MatchPlayer record(s) across ${pending.length} match(es).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

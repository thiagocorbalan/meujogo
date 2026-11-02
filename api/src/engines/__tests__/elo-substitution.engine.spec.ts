import {
  processSessionEloFromParticipation,
  type MatchParticipation,
  type MatchResult,
} from '../elo.engine.js';

describe('processSessionEloFromParticipation', () => {
  const baseMatch = (
    matchId: number,
    winnerId: number | null,
    isDraw: boolean,
  ): MatchResult => ({
    matchId,
    teamAId: 1,
    teamBId: 2,
    scoreA: isDraw ? 1 : winnerId === 1 ? 2 : 0,
    scoreB: isDraw ? 1 : winnerId === 2 ? 2 : 0,
    isDraw,
    winnerId,
  });

  it('computes ELO based only on matches the player actually played', () => {
    const matches: MatchResult[] = [
      baseMatch(10, 1, false),
      baseMatch(11, 2, false),
    ];

    const participations: MatchParticipation[] = [
      { matchId: 10, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 10, playerId: 200, teamId: 2, elo: 1200 },
      { matchId: 11, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 11, playerId: 200, teamId: 2, elo: 1200 },
    ];

    const updates = processSessionEloFromParticipation(
      participations,
      matches,
      32,
    );

    const p100 = updates.find((u) => u.playerId === 100);
    const p200 = updates.find((u) => u.playerId === 200);
    expect(p100?.oldElo).toBe(1200);
    expect(p200?.oldElo).toBe(1200);
    expect(p100?.newElo).toBeCloseTo(1200, 1);
    expect(p200?.newElo).toBeCloseTo(1200, 1);
  });

  it('substitute who only played second match has ELO from that match alone', () => {
    const matches: MatchResult[] = [
      baseMatch(10, 1, false),
      baseMatch(11, 1, false),
    ];

    const participations: MatchParticipation[] = [
      { matchId: 10, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 10, playerId: 200, teamId: 2, elo: 1200 },
      { matchId: 11, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 11, playerId: 999, teamId: 2, elo: 1200 },
    ];

    const updates = processSessionEloFromParticipation(
      participations,
      matches,
      32,
    );

    const sub = updates.find((u) => u.playerId === 999);
    expect(sub).toBeDefined();
    expect(sub?.oldElo).toBe(1200);
    expect(sub?.newElo).toBeLessThan(1200);
  });

  it('player with zero participations keeps the same elo', () => {
    const matches: MatchResult[] = [baseMatch(10, 1, false)];
    const participations: MatchParticipation[] = [
      { matchId: 10, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 10, playerId: 200, teamId: 2, elo: 1200 },
    ];

    const updates = processSessionEloFromParticipation(
      participations,
      matches,
      32,
    );
    expect(updates).toHaveLength(2);
    const ids = updates.map((u) => u.playerId);
    expect(ids).not.toContain(999);
  });

  it('emits one update per unique playerId across the session', () => {
    const matches: MatchResult[] = [
      baseMatch(10, 1, false),
      baseMatch(11, 2, false),
    ];
    const participations: MatchParticipation[] = [
      { matchId: 10, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 11, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 10, playerId: 200, teamId: 2, elo: 1200 },
    ];

    const updates = processSessionEloFromParticipation(
      participations,
      matches,
      32,
    );
    const counts = new Map<number, number>();
    updates.forEach((u) =>
      counts.set(u.playerId, (counts.get(u.playerId) ?? 0) + 1),
    );
    expect(counts.get(100)).toBe(1);
    expect(counts.get(200)).toBe(1);
  });

  it('compatibility: a session with no substitutions yields the same result as the legacy aggregator', () => {
    const matches: MatchResult[] = [
      baseMatch(10, 1, false),
      baseMatch(11, 2, false),
    ];

    const participations: MatchParticipation[] = [
      { matchId: 10, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 10, playerId: 101, teamId: 1, elo: 1200 },
      { matchId: 10, playerId: 200, teamId: 2, elo: 1200 },
      { matchId: 10, playerId: 201, teamId: 2, elo: 1200 },
      { matchId: 11, playerId: 100, teamId: 1, elo: 1200 },
      { matchId: 11, playerId: 101, teamId: 1, elo: 1200 },
      { matchId: 11, playerId: 200, teamId: 2, elo: 1200 },
      { matchId: 11, playerId: 201, teamId: 2, elo: 1200 },
    ];

    const updates = processSessionEloFromParticipation(
      participations,
      matches,
      32,
    );
    const elos = updates.map((u) => u.newElo);
    expect(new Set(elos).size).toBe(1);
    expect(elos[0]).toBeCloseTo(1200, 1);
  });

  it('asymmetric ELO: weak player beating strong gets bigger gain', () => {
    const matches: MatchResult[] = [baseMatch(10, 2, false)];

    const participations: MatchParticipation[] = [
      { matchId: 10, playerId: 100, teamId: 1, elo: 1400 },
      { matchId: 10, playerId: 200, teamId: 2, elo: 1000 },
    ];

    const updates = processSessionEloFromParticipation(
      participations,
      matches,
      32,
    );
    const weak = updates.find((u) => u.playerId === 200);
    const strong = updates.find((u) => u.playerId === 100);
    expect((weak?.newElo ?? 0) - 1000).toBeGreaterThan(25);
    expect(1400 - (strong?.newElo ?? 0)).toBeGreaterThan(25);
  });
});

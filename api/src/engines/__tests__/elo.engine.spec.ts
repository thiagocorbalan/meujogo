import {
  calculateNewElo,
  processSessionElo,
  PlayerWithTeam,
  MatchResult,
} from '../elo.engine';

describe('calculateNewElo', () => {
  it('strong player (1400) beats weak (1000): small ELO gain', () => {
    const newElo = calculateNewElo(1400, 1000, 1, 32);
    expect(newElo).toBeGreaterThan(1400);
    expect(newElo - 1400).toBeLessThan(5);
  });

  it('weak player (1000) beats strong (1400): large ELO gain', () => {
    const newElo = calculateNewElo(1000, 1400, 1, 32);
    expect(newElo).toBeGreaterThan(1000);
    expect(newElo - 1000).toBeGreaterThan(25);
  });

  it('draw between equal players: minimal change', () => {
    const newElo = calculateNewElo(1200, 1200, 0.5, 32);
    expect(newElo).toBeCloseTo(1200, 1);
  });

  it('strong player loses to weak: significant ELO loss', () => {
    const newElo = calculateNewElo(1400, 1000, 0, 32);
    expect(newElo).toBeLessThan(1400);
    expect(1400 - newElo).toBeGreaterThan(27);
  });

  it('weak player loses to strong: minimal ELO loss', () => {
    const newElo = calculateNewElo(1000, 1400, 0, 32);
    expect(newElo).toBeLessThan(1000);
    expect(1000 - newElo).toBeLessThan(5);
  });

  it('K=32 default: expected score formula is correct', () => {
    // expected = 1 / (1 + 10^((1200-1200)/400)) = 0.5
    // new = 1200 + 32 * (1 - 0.5) = 1216
    const newElo = calculateNewElo(1200, 1200, 1, 32);
    expect(newElo).toBe(1216);
  });

  it('rounds to 1 decimal place', () => {
    const newElo = calculateNewElo(1000, 1400, 1, 32);
    const decimals = (newElo.toString().split('.')[1] || '').length;
    expect(decimals).toBeLessThanOrEqual(1);
  });
});

describe('processSessionElo', () => {
  it('returns EloUpdate for each player', () => {
    const players: PlayerWithTeam[] = [
      { playerId: 1, elo: 1200, teamId: 1 },
      { playerId: 2, elo: 1200, teamId: 2 },
    ];
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 2, scoreB: 1, isDraw: false, winnerId: 1 },
    ];
    const updates = processSessionElo(players, matches, 32);
    expect(updates).toHaveLength(2);
    expect(updates[0].playerId).toBe(1);
    expect(updates[1].playerId).toBe(2);
  });

  it('2 teams, 2 matches: winner gains ELO, loser loses ELO', () => {
    const players: PlayerWithTeam[] = [
      { playerId: 1, elo: 1200, teamId: 1 },
      { playerId: 2, elo: 1200, teamId: 2 },
    ];
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 3, scoreB: 1, isDraw: false, winnerId: 1 },
      { teamAId: 1, teamBId: 2, scoreA: 2, scoreB: 0, isDraw: false, winnerId: 1 },
    ];
    const updates = processSessionElo(players, matches, 32);

    const p1 = updates.find((u) => u.playerId === 1)!;
    const p2 = updates.find((u) => u.playerId === 2)!;

    expect(p1.newElo).toBeGreaterThan(p1.oldElo);
    expect(p2.newElo).toBeLessThan(p2.oldElo);
  });

  it('2 teams, 2 matches: preserves oldElo field', () => {
    const players: PlayerWithTeam[] = [
      { playerId: 1, elo: 1400, teamId: 1 },
      { playerId: 2, elo: 1000, teamId: 2 },
    ];
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 1, scoreB: 1, isDraw: true, winnerId: null },
      { teamAId: 1, teamBId: 2, scoreA: 2, scoreB: 1, isDraw: false, winnerId: 1 },
    ];
    const updates = processSessionElo(players, matches, 32);

    const p1 = updates.find((u) => u.playerId === 1)!;
    const p2 = updates.find((u) => u.playerId === 2)!;

    expect(p1.oldElo).toBe(1400);
    expect(p2.oldElo).toBe(1000);
  });

  it('player with no matches keeps same ELO', () => {
    const players: PlayerWithTeam[] = [
      { playerId: 1, elo: 1200, teamId: 1 },
      { playerId: 99, elo: 1500, teamId: 99 },
    ];
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 1, scoreB: 0, isDraw: false, winnerId: 1 },
    ];
    const updates = processSessionElo(players, matches, 32);
    const p99 = updates.find((u) => u.playerId === 99)!;
    expect(p99.newElo).toBe(1500);
  });

  it('draw between equal players in session: minimal ELO change', () => {
    const players: PlayerWithTeam[] = [
      { playerId: 1, elo: 1200, teamId: 1 },
      { playerId: 2, elo: 1200, teamId: 2 },
    ];
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 1, scoreB: 1, isDraw: true, winnerId: null },
    ];
    const updates = processSessionElo(players, matches, 32);
    const p1 = updates.find((u) => u.playerId === 1)!;
    const p2 = updates.find((u) => u.playerId === 2)!;
    expect(Math.abs(p1.newElo - p1.oldElo)).toBeLessThan(1);
    expect(Math.abs(p2.newElo - p2.oldElo)).toBeLessThan(1);
  });
});

describe('calculateNewElo edge cases', () => {
  it('K=0: ELO does not change regardless of result', () => {
    expect(calculateNewElo(1200, 1200, 1, 0)).toBe(1200);
    expect(calculateNewElo(1200, 1200, 0, 0)).toBe(1200);
    expect(calculateNewElo(1200, 1200, 0.5, 0)).toBe(1200);
    expect(calculateNewElo(800, 1600, 1, 0)).toBe(800);
  });

  it('very high ELO (3000) vs very low (100): formula still produces valid numbers', () => {
    const highWins = calculateNewElo(3000, 100, 1, 32);
    // Expected score ≈ 1; gain rounds to 0 due to extreme difference — result is unchanged or marginally higher
    expect(highWins).toBeGreaterThanOrEqual(3000);
    expect(highWins - 3000).toBeLessThan(1);

    const lowWins = calculateNewElo(100, 3000, 1, 32);
    // Expected score ≈ 0; gain ≈ 32 * (1 - ~0) ≈ ~32
    expect(lowWins).toBeGreaterThan(100);
    expect(lowWins - 100).toBeCloseTo(32, 0);
  });
});

describe('processSessionElo edge cases', () => {
  it('empty matches array: all players keep their original ELO', () => {
    const players: PlayerWithTeam[] = [
      { playerId: 1, elo: 1200, teamId: 1 },
      { playerId: 2, elo: 1500, teamId: 2 },
    ];
    const updates = processSessionElo(players, [], 32);
    expect(updates).toHaveLength(2);
    expect(updates.find((u) => u.playerId === 1)!.newElo).toBe(1200);
    expect(updates.find((u) => u.playerId === 2)!.newElo).toBe(1500);
  });

  it('empty players array: returns empty array', () => {
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 2, scoreB: 1, isDraw: false, winnerId: 1 },
    ];
    const updates = processSessionElo([], matches, 32);
    expect(updates).toEqual([]);
  });

  it('symmetric: A beating B mirrors B losing to A in ELO delta', () => {
    const playersAB: PlayerWithTeam[] = [
      { playerId: 1, elo: 1200, teamId: 1 },
      { playerId: 2, elo: 1200, teamId: 2 },
    ];
    const match: MatchResult = {
      teamAId: 1,
      teamBId: 2,
      scoreA: 1,
      scoreB: 0,
      isDraw: false,
      winnerId: 1,
    };

    const updatesAB = processSessionElo(playersAB, [match], 32);
    const p1 = updatesAB.find((u) => u.playerId === 1)!;
    const p2 = updatesAB.find((u) => u.playerId === 2)!;

    const gainA = p1.newElo - p1.oldElo;
    const lossB = p2.oldElo - p2.newElo;

    // For equal ELOs the gain and loss should be equal and opposite
    expect(gainA).toBeCloseTo(lossB, 5);
    expect(gainA).toBeGreaterThan(0);
  });
});

import {
  shouldForceRotation,
  getNextMatch,
  Team,
  MatchHistory,
} from '../match-rotation.engine';

describe('shouldForceRotation', () => {
  it('returns false when team has played fewer than maxConsecutiveGames', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    expect(shouldForceRotation(1, history, 2)).toBe(false);
  });

  it('returns true after N consecutive games', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
      { teamAId: 1, teamBId: 3, winnerId: 1, matchOrder: 2 },
    ];
    expect(shouldForceRotation(1, history, 2)).toBe(true);
  });

  it('returns false when consecutive streak is broken', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
      { teamAId: 2, teamBId: 3, winnerId: 2, matchOrder: 2 }, // team 1 sat out
      { teamAId: 1, teamBId: 3, winnerId: 1, matchOrder: 3 },
    ];
    expect(shouldForceRotation(1, history, 2)).toBe(false);
  });

  it('returns true after 3 consecutive games when max is 3', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
      { teamAId: 1, teamBId: 3, winnerId: 1, matchOrder: 2 },
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 3 },
    ];
    expect(shouldForceRotation(1, history, 3)).toBe(true);
  });
});

describe('getNextMatch', () => {
  const teamA: Team = { id: 1, name: 'Team A' };
  const teamB: Team = { id: 2, name: 'Team B' };
  const teamC: Team = { id: 3, name: 'Team C' };
  const teamD: Team = { id: 4, name: 'Team D' };

  it('returns null when fewer than 2 teams', () => {
    expect(getNextMatch([], [], 2)).toBeNull();
    expect(getNextMatch([teamA], [], 2)).toBeNull();
  });

  it('returns first two teams when no history', () => {
    const result = getNextMatch([teamA, teamB, teamC], [], 2);
    expect(result).toEqual({ teamA, teamB });
  });

  it('3 teams: winner stays, loser rotates out, waiting team comes in', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result?.teamA).toEqual(teamA); // winner stays
    expect(result?.teamB).toEqual(teamC); // waiting team comes in
  });

  it('4 teams rotation: winner stays, loser rotates to back', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB, teamC, teamD], history, 2);
    expect(result?.teamA).toEqual(teamA); // winner stays
    expect(result?.teamB).toEqual(teamC); // first waiting team comes in
  });

  it('force rotation after 2 consecutive games: winner is sent to back', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
      { teamAId: 1, teamBId: 3, winnerId: 1, matchOrder: 2 },
    ];
    // team 1 has played 2 consecutive games, must rotate out
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    // team 1 should NOT be in the next match
    expect(result?.teamA.id).not.toBe(1);
    expect(result?.teamB.id).not.toBe(1);
  });

  it('only 2 teams: they keep alternating regardless of winner', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB], history, 2);
    // With only 2 teams, winner would stay but force rotation after 2 games
    // After 1 game, no force rotation yet — winner (1) stays, loser (2) is the only option
    expect(result?.teamA).toEqual(teamA);
    expect(result?.teamB).toEqual(teamB);
  });

  it('only 2 teams: force rotation still produces a valid match', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 2 },
    ];
    // team 1 force-rotated, queue = [teamB, teamA], so teamB vs teamA
    const result = getNextMatch([teamA, teamB], history, 2);
    expect(result).not.toBeNull();
    expect([result!.teamA.id, result!.teamB.id].sort()).toEqual([1, 2]);
  });

  it('draw: both teams rotate normally, next waiting team comes in', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: null, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    // teamA is treated as staying (draw), teamC (waiting) comes in
    expect(result?.teamA).toEqual(teamA);
    expect(result?.teamB).toEqual(teamC);
  });
});

describe('shouldForceRotation edge cases', () => {
  it('returns false with empty history', () => {
    expect(shouldForceRotation(1, [], 2)).toBe(false);
  });

  it('maxConsecutiveGames=1: returns true after a single game played', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    expect(shouldForceRotation(1, history, 1)).toBe(true);
  });

  it('maxConsecutiveGames=1: returns false for team that did not play', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    expect(shouldForceRotation(3, history, 1)).toBe(false);
  });
});

describe('getNextMatch edge cases', () => {
  const teamA: Team = { id: 1, name: 'Team A' };
  const teamB: Team = { id: 2, name: 'Team B' };
  const teamC: Team = { id: 3, name: 'Team C' };

  it('3 teams all draws: rotation still produces a valid next match', () => {
    // Match 1: teamA vs teamB, draw → stayingTeam=teamA, queue=[teamC, teamB]
    // Match 2 should be teamA vs teamC
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: null, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result).not.toBeNull();
    expect(result!.teamA).toEqual(teamA);
    expect(result!.teamB).toEqual(teamC);
  });

  it('3 teams all draws, two matches played: each draw rotates a team out', () => {
    // Match 1: A vs B, draw → match 2: A vs C
    // Match 2: A vs C, draw → stayingTeam=A, queue=[B, C], match 3: A vs B
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: null, matchOrder: 1 },
      { teamAId: 1, teamBId: 3, winnerId: null, matchOrder: 2 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result).not.toBeNull();
    // teamA has played 2 consecutive games, force rotation kicks in
    expect(result!.teamA.id).not.toBe(1);
    expect(result!.teamB.id).not.toBe(1);
  });

  it('team that lost comes back in after sitting out one match', () => {
    // Match 1: A(1) vs B(2), B wins → stayingTeam=B, queue=[C, A], match 2: B vs C
    // Match 2: B(2) vs C(3), C wins → stayingTeam=C, queue=[A, B], match 3: C vs A
    // A had lost match 1, sat out match 2, and comes back in match 3
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 2, matchOrder: 1 },
      { teamAId: 2, teamBId: 3, winnerId: 3, matchOrder: 2 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result).not.toBeNull();
    const ids = [result!.teamA.id, result!.teamB.id];
    // Team 3 stays (winner of last), Team 1 (A) comes back in from waiting
    expect(ids).toContain(3);
    expect(ids).toContain(1);
  });
});

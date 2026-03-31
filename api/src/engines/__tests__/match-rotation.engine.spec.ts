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
      { teamAId: 2, teamBId: 3, winnerId: 2, matchOrder: 2 },
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
    expect(result?.teamA).toEqual(teamA);
    expect(result?.teamB).toEqual(teamC);
  });

  it('4 teams rotation: winner stays, loser rotates to back', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB, teamC, teamD], history, 2);
    expect(result?.teamA).toEqual(teamA);
    expect(result?.teamB).toEqual(teamC);
  });

  it('force rotation after 2 consecutive games: winner is sent to back', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
      { teamAId: 1, teamBId: 3, winnerId: 1, matchOrder: 2 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result?.teamA.id).not.toBe(1);
    expect(result?.teamB.id).not.toBe(1);
  });

  it('only 2 teams: they keep alternating regardless of winner', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB], history, 2);
    expect(result?.teamA).toEqual(teamA);
    expect(result?.teamB).toEqual(teamB);
  });

  it('only 2 teams: force rotation still produces a valid match', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 1 },
      { teamAId: 1, teamBId: 2, winnerId: 1, matchOrder: 2 },
    ];
    const result = getNextMatch([teamA, teamB], history, 2);
    expect(result).not.toBeNull();
    expect([result!.teamA.id, result!.teamB.id].sort()).toEqual([1, 2]);
  });

  it('draw: both teams rotate normally, next waiting team comes in', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: null, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
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
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: null, matchOrder: 1 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result).not.toBeNull();
    expect(result!.teamA).toEqual(teamA);
    expect(result!.teamB).toEqual(teamC);
  });

  it('3 teams all draws, two matches played: each draw rotates a team out', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: null, matchOrder: 1 },
      { teamAId: 1, teamBId: 3, winnerId: null, matchOrder: 2 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result).not.toBeNull();
    expect(result!.teamA.id).not.toBe(1);
    expect(result!.teamB.id).not.toBe(1);
  });

  it('team that lost comes back in after sitting out one match', () => {
    const history: MatchHistory[] = [
      { teamAId: 1, teamBId: 2, winnerId: 2, matchOrder: 1 },
      { teamAId: 2, teamBId: 3, winnerId: 3, matchOrder: 2 },
    ];
    const result = getNextMatch([teamA, teamB, teamC], history, 2);
    expect(result).not.toBeNull();
    const ids = [result!.teamA.id, result!.teamB.id];
    expect(ids).toContain(3);
    expect(ids).toContain(1);
  });
});

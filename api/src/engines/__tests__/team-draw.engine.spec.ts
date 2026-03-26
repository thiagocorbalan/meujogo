import {
  drawTeamsBalanced,
  drawTeamsRandom,
  Player,
} from '../team-draw.engine';

const makePlayers = (count: number, baseElo = 1000, step = 50): Player[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Player ${i + 1}`,
    elo: baseElo + i * step,
  }));

describe('drawTeamsRandom', () => {
  describe('10 players, 5 per team, max 2 teams', () => {
    const players = makePlayers(10);
    const result = drawTeamsRandom(players, 5, 2);

    it('returns exactly 2 teams', () => {
      expect(result).toHaveLength(2);
    });

    it('each team has exactly 5 players', () => {
      result.forEach((team) => expect(team.players).toHaveLength(5));
    });

    it('all 10 players are distributed across teams', () => {
      const allIds = result.flatMap((t) => t.players.map((p) => p.id)).sort();
      const expectedIds = players.map((p) => p.id).sort();
      expect(allIds).toEqual(expectedIds);
    });

    it('each team has a computed avgElo', () => {
      result.forEach((team) => {
        const expected =
          team.players.reduce((s, p) => s + p.elo, 0) / team.players.length;
        expect(team.avgElo).toBeCloseTo(expected);
      });
    });
  });

  describe('7 players, 3 per team, max 2 teams — 1 leftover', () => {
    const players = makePlayers(7);
    const result = drawTeamsRandom(players, 3, 2);

    it('returns exactly 2 teams', () => {
      expect(result).toHaveLength(2);
    });

    it('allocates 6 players total (1 leftover excluded)', () => {
      const total = result.reduce((s, t) => s + t.players.length, 0);
      expect(total).toBe(6);
    });
  });

  describe('0 players', () => {
    it('returns an empty array', () => {
      expect(drawTeamsRandom([], 5, 2)).toEqual([]);
    });
  });

  describe('fewer players than playersPerTeam', () => {
    it('returns no teams when only 3 players but 5 required per team', () => {
      const players = makePlayers(3);
      expect(drawTeamsRandom(players, 5, 2)).toEqual([]);
    });
  });
});

describe('drawTeamsBalanced', () => {
  describe('10 players, 5 per team, max 2 teams', () => {
    const players = makePlayers(10, 1000, 50);
    const result = drawTeamsBalanced(players, 5, 2);

    it('returns exactly 2 teams', () => {
      expect(result).toHaveLength(2);
    });

    it('each team has exactly 5 players', () => {
      result.forEach((team) => expect(team.players).toHaveLength(5));
    });

    it('all 10 players are distributed across teams', () => {
      const allIds = result.flatMap((t) => t.players.map((p) => p.id)).sort();
      const expectedIds = players.map((p) => p.id).sort();
      expect(allIds).toEqual(expectedIds);
    });

    it('average ELO difference between teams is less than 10% of ELO spread', () => {
      const elos = players.map((p) => p.elo);
      const spread = Math.max(...elos) - Math.min(...elos);
      const [teamA, teamB] = result;
      const diff = Math.abs(teamA.avgElo - teamB.avgElo);
      expect(diff).toBeLessThan(spread * 0.1);
    });
  });

  describe('7 players, 3 per team, max 2 teams — 1 leftover', () => {
    const players = makePlayers(7);
    const result = drawTeamsBalanced(players, 3, 2);

    it('returns exactly 2 teams', () => {
      expect(result).toHaveLength(2);
    });

    it('allocates 6 players total (1 leftover excluded)', () => {
      const total = result.reduce((s, t) => s + t.players.length, 0);
      expect(total).toBe(6);
    });
  });

  describe('0 players', () => {
    it('returns an empty array', () => {
      expect(drawTeamsBalanced([], 5, 2)).toEqual([]);
    });
  });

  describe('fewer players than playersPerTeam', () => {
    it('returns no teams when only 3 players but 5 required per team', () => {
      const players = makePlayers(3);
      expect(drawTeamsBalanced(players, 5, 2)).toEqual([]);
    });
  });
});

describe('drawTeamsRandom edge cases', () => {
  it('1 player only: returns empty (not enough for a team)', () => {
    const players = makePlayers(1);
    expect(drawTeamsRandom(players, 3, 2)).toEqual([]);
  });

  it('exact fit: 6 players, 3 per team, max 2 — returns 2 full teams with no leftovers', () => {
    const players = makePlayers(6);
    const result = drawTeamsRandom(players, 3, 2);
    expect(result).toHaveLength(2);
    const total = result.reduce((s, t) => s + t.players.length, 0);
    expect(total).toBe(6);
  });

  it('playersPerTeam=1, maxTeams=5, 5 players: returns 5 teams of 1', () => {
    const players = makePlayers(5);
    const result = drawTeamsRandom(players, 1, 5);
    expect(result).toHaveLength(5);
    result.forEach((team) => expect(team.players).toHaveLength(1));
  });

  it('maxTeams=1: returns exactly 1 team', () => {
    const players = makePlayers(5);
    const result = drawTeamsRandom(players, 3, 1);
    expect(result).toHaveLength(1);
    expect(result[0].players).toHaveLength(3);
  });

  it('negative playersPerTeam: returns empty', () => {
    const players = makePlayers(5);
    expect(drawTeamsRandom(players, -1, 2)).toEqual([]);
  });

  it('zero playersPerTeam: returns empty', () => {
    const players = makePlayers(5);
    expect(drawTeamsRandom(players, 0, 2)).toEqual([]);
  });

  it('large numbers: 100 players, 10 per team, 4 teams — no crash and returns 4 teams', () => {
    const players = makePlayers(100);
    const result = drawTeamsRandom(players, 10, 4);
    expect(result).toHaveLength(4);
    result.forEach((team) => expect(team.players).toHaveLength(10));
    const allIds = result.flatMap((t) => t.players.map((p) => p.id));
    // All IDs unique
    expect(new Set(allIds).size).toBe(40);
  });
});

describe('drawTeamsBalanced edge cases', () => {
  it('1 player only: returns empty (not enough for a team)', () => {
    const players = makePlayers(1);
    expect(drawTeamsBalanced(players, 3, 2)).toEqual([]);
  });

  it('exact fit: 6 players, 3 per team, max 2 — returns 2 full teams with no leftovers', () => {
    const players = makePlayers(6);
    const result = drawTeamsBalanced(players, 3, 2);
    expect(result).toHaveLength(2);
    const total = result.reduce((s, t) => s + t.players.length, 0);
    expect(total).toBe(6);
  });

  it('all same ELO: balanced mode still distributes all players evenly', () => {
    const players = makePlayers(6, 1000, 0); // all ELO = 1000
    const result = drawTeamsBalanced(players, 3, 2);
    expect(result).toHaveLength(2);
    result.forEach((team) => {
      expect(team.players).toHaveLength(3);
      expect(team.avgElo).toBe(1000);
    });
  });

  it('playersPerTeam=1, maxTeams=5, 5 players: returns 5 teams of 1', () => {
    const players = makePlayers(5);
    const result = drawTeamsBalanced(players, 1, 5);
    expect(result).toHaveLength(5);
    result.forEach((team) => expect(team.players).toHaveLength(1));
  });

  it('maxTeams=1: returns exactly 1 team', () => {
    const players = makePlayers(5);
    const result = drawTeamsBalanced(players, 3, 1);
    expect(result).toHaveLength(1);
    expect(result[0].players).toHaveLength(3);
  });

  it('negative playersPerTeam: returns empty', () => {
    const players = makePlayers(5);
    expect(drawTeamsBalanced(players, -1, 2)).toEqual([]);
  });

  it('zero playersPerTeam: returns empty', () => {
    const players = makePlayers(5);
    expect(drawTeamsBalanced(players, 0, 2)).toEqual([]);
  });

  it('large numbers: 100 players, 10 per team, 4 teams — no crash and returns 4 teams', () => {
    const players = makePlayers(100);
    const result = drawTeamsBalanced(players, 10, 4);
    expect(result).toHaveLength(4);
    result.forEach((team) => expect(team.players).toHaveLength(10));
    const allIds = result.flatMap((t) => t.players.map((p) => p.id));
    expect(new Set(allIds).size).toBe(40);
  });
});

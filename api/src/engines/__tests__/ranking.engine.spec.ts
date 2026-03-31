import { calculateRanking, MatchResult, TeamInfo } from '../ranking.engine';

const teams: TeamInfo[] = [
  { id: 1, name: 'Red', color: '#FF0000' },
  { id: 2, name: 'Blue', color: '#0000FF' },
  { id: 3, name: 'Green', color: '#00FF00' },
];

describe('calculateRanking', () => {
  it('should rank 3 teams with a clear winner', () => {
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 2, scoreB: 0, isDraw: false, winnerId: 1 },
      { teamAId: 1, teamBId: 3, scoreA: 3, scoreB: 1, isDraw: false, winnerId: 1 },
      { teamAId: 2, teamBId: 3, scoreA: 1, scoreB: 0, isDraw: false, winnerId: 2 },
    ];

    const ranking = calculateRanking(matches, teams);

    expect(ranking[0].teamId).toBe(1);
    expect(ranking[0].points).toBe(6);
    expect(ranking[0].wins).toBe(2);
    expect(ranking[0].losses).toBe(0);

    expect(ranking[1].teamId).toBe(2);
    expect(ranking[1].points).toBe(3);

    expect(ranking[2].teamId).toBe(3);
    expect(ranking[2].points).toBe(0);
  });

  it('should tiebreak by goal difference', () => {
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 3, scoreA: 3, scoreB: 0, isDraw: false, winnerId: 1 },
      { teamAId: 2, teamBId: 3, scoreA: 1, scoreB: 0, isDraw: false, winnerId: 2 },
      { teamAId: 1, teamBId: 2, scoreA: 0, scoreB: 1, isDraw: false, winnerId: 2 },
    ];

    const ranking = calculateRanking(matches, teams);

    expect(ranking[0].teamId).toBe(2);
    expect(ranking[0].points).toBe(6);

    expect(ranking[1].teamId).toBe(1);
    expect(ranking[1].goalDifference).toBe(2);

    expect(ranking[2].teamId).toBe(3);
  });

  it('should tiebreak by goals scored when points and GD are equal', () => {
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 3, scoreA: 3, scoreB: 1, isDraw: false, winnerId: 1 },
      { teamAId: 2, teamBId: 3, scoreA: 2, scoreB: 0, isDraw: false, winnerId: 2 },
      { teamAId: 1, teamBId: 2, scoreA: 1, scoreB: 1, isDraw: true, winnerId: null },
    ];

    const ranking = calculateRanking(matches, teams);

    expect(ranking[0].teamId).toBe(1);
    expect(ranking[0].points).toBe(4);
    expect(ranking[0].goalsFor).toBe(4);

    expect(ranking[1].teamId).toBe(2);
    expect(ranking[1].points).toBe(4);
    expect(ranking[1].goalsFor).toBe(3);

    expect(ranking[2].teamId).toBe(3);
    expect(ranking[2].points).toBe(0);
  });

  it('should return zeros for a team with no matches', () => {
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 2, scoreB: 1, isDraw: false, winnerId: 1 },
    ];

    const ranking = calculateRanking(matches, teams);
    const team3 = ranking.find((r) => r.teamId === 3)!;

    expect(team3.played).toBe(0);
    expect(team3.wins).toBe(0);
    expect(team3.draws).toBe(0);
    expect(team3.losses).toBe(0);
    expect(team3.goalsFor).toBe(0);
    expect(team3.goalsAgainst).toBe(0);
    expect(team3.goalDifference).toBe(0);
    expect(team3.points).toBe(0);
  });

  it('should handle all draws scenario', () => {
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 1, scoreB: 1, isDraw: true, winnerId: null },
      { teamAId: 1, teamBId: 3, scoreA: 0, scoreB: 0, isDraw: true, winnerId: null },
      { teamAId: 2, teamBId: 3, scoreA: 2, scoreB: 2, isDraw: true, winnerId: null },
    ];

    const ranking = calculateRanking(matches, teams);

    for (const entry of ranking) {
      expect(entry.wins).toBe(0);
      expect(entry.losses).toBe(0);
      expect(entry.draws).toBe(2);
      expect(entry.points).toBe(2);
      expect(entry.goalDifference).toBe(0);
    }

    const goalsFor = ranking.map((r) => r.goalsFor);
    expect(goalsFor[0]).toBeGreaterThanOrEqual(goalsFor[1]);
    expect(goalsFor[1]).toBeGreaterThanOrEqual(goalsFor[2]);
  });
});

describe('calculateRanking edge cases', () => {
  it('empty matches AND empty teams: returns empty array', () => {
    const ranking = calculateRanking([], []);
    expect(ranking).toEqual([]);
  });

  it('single team with no matches: returns array with that team at all zeros', () => {
    const singleTeam: TeamInfo[] = [{ id: 1, name: 'Solo', color: '#FFFFFF' }];
    const ranking = calculateRanking([], singleTeam);
    expect(ranking).toHaveLength(1);
    expect(ranking[0].teamId).toBe(1);
    expect(ranking[0].played).toBe(0);
    expect(ranking[0].wins).toBe(0);
    expect(ranking[0].draws).toBe(0);
    expect(ranking[0].losses).toBe(0);
    expect(ranking[0].goalsFor).toBe(0);
    expect(ranking[0].goalsAgainst).toBe(0);
    expect(ranking[0].goalDifference).toBe(0);
    expect(ranking[0].points).toBe(0);
  });

  it('high-scoring match (10-9): correctly accounts for large goal numbers', () => {
    const twoTeams: TeamInfo[] = [
      { id: 1, name: 'Red', color: '#FF0000' },
      { id: 2, name: 'Blue', color: '#0000FF' },
    ];
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 2, scoreA: 10, scoreB: 9, isDraw: false, winnerId: 1 },
    ];
    const ranking = calculateRanking(matches, twoTeams);
    const red = ranking.find((r) => r.teamId === 1)!;
    const blue = ranking.find((r) => r.teamId === 2)!;

    expect(red.goalsFor).toBe(10);
    expect(red.goalsAgainst).toBe(9);
    expect(red.goalDifference).toBe(1);
    expect(red.points).toBe(3);

    expect(blue.goalsFor).toBe(9);
    expect(blue.goalsAgainst).toBe(10);
    expect(blue.goalDifference).toBe(-1);
    expect(blue.points).toBe(0);
  });

  it('match referencing a team not in teams list: skips match gracefully without crash', () => {
    const knownTeams: TeamInfo[] = [{ id: 1, name: 'Red', color: '#FF0000' }];
    const matches: MatchResult[] = [
      { teamAId: 1, teamBId: 99, scoreA: 2, scoreB: 0, isDraw: false, winnerId: 1 },
    ];
    expect(() => calculateRanking(matches, knownTeams)).not.toThrow();
    const ranking = calculateRanking(matches, knownTeams);
    const red = ranking.find((r) => r.teamId === 1)!;
    expect(red.played).toBe(0);
    expect(red.points).toBe(0);
  });
});

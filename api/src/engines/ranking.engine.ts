export interface MatchResult {
  teamAId: number;
  teamBId: number;
  scoreA: number;
  scoreB: number;
  isDraw: boolean;
  winnerId: number | null;
}

export interface TeamInfo {
  id: number;
  name: string;
  color: string;
}

export interface TeamRanking {
  teamId: number;
  name: string;
  color: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export function calculateRanking(
  matches: MatchResult[],
  teams: TeamInfo[],
): TeamRanking[] {
  const rankingMap = new Map<number, TeamRanking>();

  for (const team of teams) {
    rankingMap.set(team.id, {
      teamId: team.id,
      name: team.name,
      color: team.color,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    });
  }

  for (const match of matches) {
    const teamA = rankingMap.get(match.teamAId);
    const teamB = rankingMap.get(match.teamBId);

    if (!teamA || !teamB) continue;

    teamA.played += 1;
    teamB.played += 1;

    teamA.goalsFor += match.scoreA;
    teamA.goalsAgainst += match.scoreB;

    teamB.goalsFor += match.scoreB;
    teamB.goalsAgainst += match.scoreA;

    if (match.isDraw) {
      teamA.draws += 1;
      teamA.points += 1;
      teamB.draws += 1;
      teamB.points += 1;
    } else if (match.winnerId === match.teamAId) {
      teamA.wins += 1;
      teamA.points += 3;
      teamB.losses += 1;
    } else if (match.winnerId === match.teamBId) {
      teamB.wins += 1;
      teamB.points += 3;
      teamA.losses += 1;
    }

    teamA.goalDifference = teamA.goalsFor - teamA.goalsAgainst;
    teamB.goalDifference = teamB.goalsFor - teamB.goalsAgainst;
  }

  return Array.from(rankingMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference)
      return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });
}

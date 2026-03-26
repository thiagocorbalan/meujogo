export interface EloUpdate {
  playerId: number;
  oldElo: number;
  newElo: number;
}

export interface PlayerWithTeam {
  playerId: number;
  elo: number;
  teamId: number;
}

export interface MatchResult {
  teamAId: number;
  teamBId: number;
  scoreA: number;
  scoreB: number;
  isDraw: boolean;
  winnerId: number | null;
}

export function calculateNewElo(
  playerElo: number,
  opponentAvgElo: number,
  result: number,
  kFactor: number,
): number {
  const expected = 1 / (1 + Math.pow(10, (opponentAvgElo - playerElo) / 400));
  const newElo = playerElo + kFactor * (result - expected);
  return Math.round(newElo * 10) / 10;
}

export function processSessionElo(
  players: PlayerWithTeam[],
  matches: MatchResult[],
  kFactor: number,
): EloUpdate[] {
  return players.map((player) => {
    const teamMatches = matches.filter(
      (m) => m.teamAId === player.teamId || m.teamBId === player.teamId,
    );

    if (teamMatches.length === 0) {
      return { playerId: player.playerId, oldElo: player.elo, newElo: player.elo };
    }

    let totalResult = 0;
    let totalOpponentElo = 0;

    for (const match of teamMatches) {
      const isTeamA = match.teamAId === player.teamId;
      const opponentTeamId = isTeamA ? match.teamBId : match.teamAId;

      const opponentPlayers = players.filter((p) => p.teamId === opponentTeamId);
      const opponentAvgElo =
        opponentPlayers.length > 0
          ? opponentPlayers.reduce((sum, p) => sum + p.elo, 0) / opponentPlayers.length
          : 1000;

      totalOpponentElo += opponentAvgElo;

      if (match.isDraw) {
        totalResult += 0.5;
      } else if (match.winnerId === player.teamId) {
        totalResult += 1;
      } else {
        totalResult += 0;
      }
    }

    const avgResult = totalResult / teamMatches.length;
    const avgOpponentElo = totalOpponentElo / teamMatches.length;

    const newElo = calculateNewElo(player.elo, avgOpponentElo, avgResult, kFactor);

    return { playerId: player.playerId, oldElo: player.elo, newElo };
  });
}

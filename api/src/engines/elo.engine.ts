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
  matchId?: number;
  teamAId: number;
  teamBId: number;
  scoreA: number;
  scoreB: number;
  isDraw: boolean;
  winnerId: number | null;
}

export interface MatchParticipation {
  matchId: number;
  playerId: number;
  teamId: number;
  elo: number;
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
      return {
        playerId: player.playerId,
        oldElo: player.elo,
        newElo: player.elo,
      };
    }

    let totalResult = 0;
    let totalOpponentElo = 0;

    for (const match of teamMatches) {
      const isTeamA = match.teamAId === player.teamId;
      const opponentTeamId = isTeamA ? match.teamBId : match.teamAId;

      const opponentPlayers = players.filter(
        (p) => p.teamId === opponentTeamId,
      );
      const opponentAvgElo =
        opponentPlayers.length > 0
          ? opponentPlayers.reduce((sum, p) => sum + p.elo, 0) /
            opponentPlayers.length
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

    const newElo = calculateNewElo(
      player.elo,
      avgOpponentElo,
      avgResult,
      kFactor,
    );

    return { playerId: player.playerId, oldElo: player.elo, newElo };
  });
}

export function processSessionEloFromParticipation(
  participations: MatchParticipation[],
  matches: MatchResult[],
  kFactor: number,
): EloUpdate[] {
  const matchById = new Map<number, MatchResult>();
  for (const m of matches) {
    if (m.matchId !== undefined) matchById.set(m.matchId, m);
  }

  const participationsByMatch = new Map<number, MatchParticipation[]>();
  for (const p of participations) {
    const list = participationsByMatch.get(p.matchId) ?? [];
    list.push(p);
    participationsByMatch.set(p.matchId, list);
  }

  const playerOldElo = new Map<number, number>();
  const playerParticipations = new Map<number, MatchParticipation[]>();
  for (const p of participations) {
    if (!playerOldElo.has(p.playerId)) playerOldElo.set(p.playerId, p.elo);
    const list = playerParticipations.get(p.playerId) ?? [];
    list.push(p);
    playerParticipations.set(p.playerId, list);
  }

  const updates: EloUpdate[] = [];

  for (const [playerId, plays] of playerParticipations) {
    const oldElo = playerOldElo.get(playerId) ?? 1000;

    if (plays.length === 0) {
      updates.push({ playerId, oldElo, newElo: oldElo });
      continue;
    }

    let totalResult = 0;
    let totalOpponentElo = 0;
    let counted = 0;

    for (const play of plays) {
      const match = matchById.get(play.matchId);
      if (!match) continue;

      const opponentTeamId =
        play.teamId === match.teamAId ? match.teamBId : match.teamAId;
      const matchParticipants = participationsByMatch.get(play.matchId) ?? [];
      const opponents = matchParticipants.filter(
        (mp) => mp.teamId === opponentTeamId,
      );
      const opponentAvgElo =
        opponents.length > 0
          ? opponents.reduce((sum, o) => sum + o.elo, 0) / opponents.length
          : 1000;

      totalOpponentElo += opponentAvgElo;

      if (match.isDraw) {
        totalResult += 0.5;
      } else if (match.winnerId === play.teamId) {
        totalResult += 1;
      }
      counted += 1;
    }

    if (counted === 0) {
      updates.push({ playerId, oldElo, newElo: oldElo });
      continue;
    }

    const avgResult = totalResult / counted;
    const avgOpponentElo = totalOpponentElo / counted;
    const newElo = calculateNewElo(oldElo, avgOpponentElo, avgResult, kFactor);
    updates.push({ playerId, oldElo, newElo });
  }

  return updates;
}

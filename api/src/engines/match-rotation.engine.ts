export interface Team {
  id: number;
  name: string;
}

export interface MatchHistory {
  teamAId: number;
  teamBId: number;
  winnerId: number | null;
  matchOrder: number;
}

export function shouldForceRotation(
  teamId: number,
  matchHistory: MatchHistory[],
  maxConsecutiveGames: number,
): boolean {
  const sorted = [...matchHistory].sort((a, b) => b.matchOrder - a.matchOrder);
  let consecutive = 0;
  for (const match of sorted) {
    const played = match.teamAId === teamId || match.teamBId === teamId;
    if (!played) break;
    consecutive++;
    if (consecutive >= maxConsecutiveGames) return true;
  }
  return false;
}

export function getNextMatch(
  teams: Team[],
  matchHistory: MatchHistory[],
  maxConsecutiveGames = 2,
): { teamA: Team; teamB: Team } | null {
  if (teams.length < 2) return null;

  if (matchHistory.length === 0) {
    return { teamA: teams[0], teamB: teams[1] };
  }

  const sorted = [...matchHistory].sort((a, b) => b.matchOrder - a.matchOrder);
  const last = sorted[0];

  const winnerId = last.winnerId;
  const loserId =
    winnerId === null
      ? null
      : winnerId === last.teamAId
        ? last.teamBId
        : last.teamAId;

  // Teams that were just playing
  const playingIds = new Set([last.teamAId, last.teamBId]);

  // Queue: teams not currently playing, in original order
  const waiting = teams.filter((t) => !playingIds.has(t.id));

  // Determine which team stays (winner) and which rotates out (loser)
  const winnerTeam = teams.find((t) => t.id === winnerId) ?? null;
  const loserTeam = loserId !== null ? (teams.find((t) => t.id === loserId) ?? null) : null;

  // Draw case: both teams rotate normally — treat teamA as loser for rotation purposes
  const stayingTeam =
    winnerId === null
      ? teams.find((t) => t.id === last.teamAId) ?? null
      : winnerTeam;
  const rotatingOutTeam =
    winnerId === null
      ? teams.find((t) => t.id === last.teamBId) ?? null
      : loserTeam;

  // Build queue: waiting teams first, then the rotating-out team
  const queue: Team[] = [
    ...waiting,
    ...(rotatingOutTeam ? [rotatingOutTeam] : []),
  ];

  // Check if staying team must be force-rotated
  if (
    stayingTeam &&
    shouldForceRotation(stayingTeam.id, matchHistory, maxConsecutiveGames)
  ) {
    // Force staying team to back of queue, next two in queue play
    const fullQueue: Team[] = [...queue, stayingTeam];
    if (fullQueue.length < 2) return null;
    return { teamA: fullQueue[0], teamB: fullQueue[1] };
  }

  if (!stayingTeam || queue.length === 0) return null;

  return { teamA: stayingTeam, teamB: queue[0] };
}

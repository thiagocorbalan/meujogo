export interface Player {
  id: number;
  name: string;
  elo: number;
}

export interface DrawnTeam {
  players: Player[];
  avgElo: number;
}

function calculateAvgElo(players: Player[]): number {
  if (players.length === 0) return 0;
  const total = players.reduce((sum, p) => sum + p.elo, 0);
  return total / players.length;
}

function buildTeams(
  orderedPlayers: Player[],
  playersPerTeam: number,
  maxTeams: number,
): DrawnTeam[] {
  const totalSlots = playersPerTeam * maxTeams;
  const eligible = orderedPlayers.slice(0, totalSlots);

  const teams: Player[][] = Array.from({ length: maxTeams }, () => []);

  for (let i = 0; i < eligible.length; i++) {
    const teamIndex = Math.floor(i / playersPerTeam);
    teams[teamIndex]!.push(eligible[i]!);
  }

  return teams
    .filter((players) => players.length === playersPerTeam)
    .map((players) => ({ players, avgElo: calculateAvgElo(players) }));
}

export function drawTeamsRandom(
  players: Player[],
  playersPerTeam: number,
  maxTeams: number,
): DrawnTeam[] {
  if (players.length === 0 || playersPerTeam <= 0 || maxTeams <= 0) return [];

  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const numTeams = Math.min(maxTeams, Math.floor(shuffled.length / playersPerTeam));
  if (numTeams === 0) return [];

  return buildTeams(shuffled, playersPerTeam, numTeams);
}

export function drawTeamsBalanced(
  players: Player[],
  playersPerTeam: number,
  maxTeams: number,
): DrawnTeam[] {
  if (players.length === 0 || playersPerTeam <= 0 || maxTeams <= 0) return [];

  const numTeams = Math.min(maxTeams, Math.floor(players.length / playersPerTeam));
  if (numTeams === 0) return [];

  const sorted = [...players].sort((a, b) => b.elo - a.elo);
  const eligible = sorted.slice(0, playersPerTeam * numTeams);

  const teams: Player[][] = Array.from({ length: numTeams }, () => []);

  for (let i = 0; i < eligible.length; i++) {
    const round = Math.floor(i / numTeams);
    const positionInRound = i % numTeams;
    const teamIndex =
      round % 2 === 0 ? positionInRound : numTeams - 1 - positionInRound;
    teams[teamIndex]!.push(eligible[i]!);
  }

  return teams
    .filter((players) => players.length === playersPerTeam)
    .map((players) => ({ players, avgElo: calculateAvgElo(players) }));
}

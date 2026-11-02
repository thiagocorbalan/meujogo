import type { Match, LateGoalRequest } from '~/types/match';

interface StartMatchRequest {
  teamAId: number;
  teamBId: number;
}

interface RegisterGoalRequest {
  playerId: number;
  teamId: number;
  minute?: number | null;
}

interface EndMatchRequest {
  winnerId?: number | null;
}

export function useMatches() {
  const { fetch } = useApi();
  return {
    getMatches: (sessionId: string | number) =>
      fetch<Match[]>(`/sessions/${sessionId}/matches`),
    startMatch: (sessionId: string | number, data: StartMatchRequest) =>
      fetch<Match>(`/sessions/${sessionId}/matches/start`, { method: 'POST', body: data }),
    registerGoal: (matchId: string | number, data: RegisterGoalRequest) =>
      fetch<Match>(`/matches/${matchId}/goal`, { method: 'PATCH', body: data }),
    endMatch: (matchId: string | number, data: EndMatchRequest) =>
      fetch<Match>(`/matches/${matchId}/end`, { method: 'PATCH', body: data }),
    undoGoal: (matchId: string | number, goalId: string | number) =>
      fetch<Match>(`/matches/${matchId}/goal/${goalId}`, { method: 'DELETE' }),
    registerLateGoal: (matchId: string | number, data: LateGoalRequest) =>
      fetch<Match>(`/matches/${matchId}/late-goal`, { method: 'POST', body: data }),
    undoLateGoal: (matchId: string | number, goalId: string | number) =>
      fetch<Match>(`/matches/${matchId}/late-goal/${goalId}`, { method: 'DELETE' }),
    getNextMatch: (sessionId: string | number) =>
      fetch<Match | null>(`/sessions/${sessionId}/matches/next`),
  };
}

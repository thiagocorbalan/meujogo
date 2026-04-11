export function useMatches() {
  const { fetch } = useApi();
  return {
    getMatches: (sessionId: string | number) => fetch(`/sessions/${sessionId}/matches`),
    startMatch: (sessionId: string | number, data: any) =>
      fetch(`/sessions/${sessionId}/matches/start`, { method: 'POST', body: data }),
    registerGoal: (matchId: string | number, data: any) =>
      fetch(`/matches/${matchId}/goal`, { method: 'PATCH', body: data }),
    endMatch: (matchId: string | number, data: any) =>
      fetch(`/matches/${matchId}/end`, { method: 'PATCH', body: data }),
    undoGoal: (matchId: string | number, goalId: string | number) =>
      fetch(`/matches/${matchId}/goal/${goalId}`, { method: 'DELETE' }),
    getNextMatch: (sessionId: string | number) => fetch(`/sessions/${sessionId}/matches/next`),
  };
}

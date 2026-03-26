export function useRanking() {
  const { fetch } = useApi();
  return {
    getSessionRanking: (sessionId: string | number) => fetch(`/sessions/${sessionId}/ranking`),
    getSeasonRanking: (seasonId: string | number) => fetch(`/seasons/${seasonId}/ranking`),
  };
}

export function useTeams() {
  const { fetch } = useApi();
  return {
    getTeams: (sessionId: string | number) => fetch(`/sessions/${sessionId}/teams`),
    drawTeams: (sessionId: string | number, mode?: string) =>
      fetch(`/sessions/${sessionId}/draw`, { method: 'POST', body: { mode } }),
  };
}

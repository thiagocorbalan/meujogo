export function useAttendance() {
  const { fetch } = useApi();
  return {
    getAttendance: (sessionId: string | number, search?: string) =>
      fetch(`/sessions/${sessionId}/attendance${search ? `?search=${search}` : ''}`),
    updateAttendance: (sessionId: string | number, playerId: string | number, data: any) =>
      fetch(`/sessions/${sessionId}/attendance/${playerId}`, { method: 'PATCH', body: data }),
  };
}

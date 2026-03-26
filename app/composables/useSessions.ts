export function useSessions() {
  const { fetch } = useApi();
  return {
    getSessions: () => fetch('/sessions'),
    getSession: (id: string | number) => fetch(`/sessions/${id}`),
    createSession: (data: any) => fetch('/sessions', { method: 'POST', body: data }),
    startSession: (id: string | number) => fetch(`/sessions/${id}/start`, { method: 'PATCH' }),
    endSession: (id: string | number) => fetch(`/sessions/${id}/end`, { method: 'PATCH' }),
  };
}

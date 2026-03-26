export function usePlayers() {
  const { fetch } = useApi();
  return {
    getPlayers: () => fetch('/players'),
    getPlayer: (id: string | number) => fetch(`/players/${id}`),
    createPlayer: (data: any) => fetch('/players', { method: 'POST', body: data }),
    updatePlayer: (id: string | number, data: any) => fetch(`/players/${id}`, { method: 'PATCH', body: data }),
    deletePlayer: (id: string | number) => fetch(`/players/${id}`, { method: 'DELETE' }),
  };
}

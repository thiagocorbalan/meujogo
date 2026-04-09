export function usePlayers() {
  const { fetch } = useApi();
  return {
    getMe: () => fetch('/players/me'),
    updateMyProfile: (data: any) => fetch('/players/me/profile', { method: 'PATCH', body: data }),
  };
}

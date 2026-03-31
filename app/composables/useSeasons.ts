export function useSeasons() {
  const { fetch } = useApi();
  return {
    getSeasons: () => fetch('/seasons'),
    createSeason: (data: any) => fetch('/seasons', { method: 'POST', body: data }),
    closeSeason: (id: string | number) => fetch(`/seasons/${id}/close`, { method: 'PATCH' }),
    closeAndRenewSeason: () => fetch('/seasons/close-and-renew', { method: 'POST' }),
  };
}

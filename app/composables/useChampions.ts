export function useChampions() {
  const { fetch, baseURL } = useApi();
  return {
    getChampions: () => fetch('/champions'),
    getChampion: (id: string | number) => fetch(`/champions/${id}`),
    getSessionChampion: (sessionId: string | number) =>
      fetch(`/sessions/${sessionId}/champion`),
    createChampion: (sessionId: string | number) =>
      fetch(`/sessions/${sessionId}/champion`, { method: 'POST' }),
    uploadChampionPhoto: (championId: number, file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      return fetch(`/champions/${championId}/photo`, {
        method: 'POST',
        body: formData,
      });
    },
  };
}

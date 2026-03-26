export function useSettings() {
  const { fetch } = useApi();
  return {
    getSettings: () => fetch('/settings'),
    updateSettings: (data: any) => fetch('/settings', { method: 'PATCH', body: data }),
  };
}

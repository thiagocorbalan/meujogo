export function useDashboard() {
  const { fetch } = useApi();
  return {
    getDashboard: () => fetch('/dashboard'),
  };
}

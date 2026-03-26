export function useStats() {
  const { fetch } = useApi()
  return {
    getTopScorers: (params?: { limit?: number; seasonId?: number }) =>
      fetch('/stats/top-scorers', { params }),
    getTopElo: (params?: { limit?: number; seasonId?: number }) =>
      fetch('/stats/top-elo', { params }),
  }
}

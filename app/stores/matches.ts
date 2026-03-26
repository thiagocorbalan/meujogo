import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useMatchesStore = defineStore('matches', () => {
  const { getMatches, startMatch: startMatchApi, registerGoal: registerGoalApi, endMatch: endMatchApi } = useMatches();
  const matches = ref<any[]>([]);
  const loading = ref(false);

  const currentMatch = computed(() =>
    matches.value.find((m: any) => m.winnerId == null && m.isDraw !== true) ?? null
  );

  const upcomingMatches = computed<any[]>(() => []);

  const completedMatches = computed(() =>
    matches.value.filter((m: any) => m.winnerId != null || m.isDraw === true)
  );

  async function fetchMatches(sessionId: number) {
    loading.value = true;
    try { matches.value = (await getMatches(sessionId)) as any[]; }
    finally { loading.value = false; }
  }

  async function startMatch(sessionId: number, data: any) {
    loading.value = true;
    try {
      const match = await startMatchApi(sessionId, data);
      await fetchMatches(sessionId);
      return match;
    } finally { loading.value = false; }
  }

  async function registerGoal(matchId: number, data: any) {
    await registerGoalApi(matchId, data);
  }

  async function endMatch(matchId: number, data: any) {
    await endMatchApi(matchId, data);
  }

  return { matches, loading, currentMatch, upcomingMatches, completedMatches, fetchMatches, startMatch, registerGoal, endMatch };
});

import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useRankingStore = defineStore('ranking', () => {
  const { getSessionRanking, getSeasonRanking } = useRanking();
  const sessionRanking = ref<any[]>([]);
  const seasonRanking = ref<any[]>([]);
  const loading = ref(false);

  async function fetchSessionRanking(sessionId: number) {
    loading.value = true;
    try { sessionRanking.value = (await getSessionRanking(sessionId)) as any[]; }
    finally { loading.value = false; }
  }

  async function fetchSeasonRanking(seasonId: number) {
    loading.value = true;
    try { seasonRanking.value = (await getSeasonRanking(seasonId)) as any[]; }
    finally { loading.value = false; }
  }

  return { sessionRanking, seasonRanking, loading, fetchSessionRanking, fetchSeasonRanking };
});

import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useTeamsStore = defineStore('teams', () => {
  const { getTeams, drawTeams: drawTeamsApi } = useTeams();
  const teams = ref<any[]>([]);
  const loading = ref(false);

  async function fetchTeams(sessionId: number) {
    loading.value = true;
    try { teams.value = (await getTeams(sessionId)) as any[]; }
    finally { loading.value = false; }
  }

  async function drawTeams(sessionId: number, mode?: string) {
    loading.value = true;
    try { teams.value = (await drawTeamsApi(sessionId, mode)) as any[]; }
    finally { loading.value = false; }
  }

  return { teams, loading, fetchTeams, drawTeams };
});

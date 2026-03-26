import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useAttendanceStore = defineStore('attendance', () => {
  const { getAttendance, updateAttendance } = useAttendance();
  const list = ref<any[]>([]);
  const search = ref('');
  const loading = ref(false);

  const confirmedPlayers = computed(() => list.value.filter((a: any) => a.status === 'ATIVO'));
  const confirmedLinhaPlayers = computed(() => confirmedPlayers.value.filter((a: any) => a.player?.position === 'LINHA'));

  async function fetchAttendance(sessionId: number) {
    loading.value = true;
    try { list.value = (await getAttendance(sessionId, search.value || undefined)) as any[]; }
    finally { loading.value = false; }
  }

  async function update(sessionId: number, playerId: number, data: any) {
    await updateAttendance(sessionId, playerId, data);
    await fetchAttendance(sessionId);
  }

  return { list, search, loading, confirmedPlayers, confirmedLinhaPlayers, fetchAttendance, update };
});

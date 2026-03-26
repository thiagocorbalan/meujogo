<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-5">Confirmação de Presença</h1>

    <!-- Error banner -->
    <div
      v-if="errorMessage"
      class="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-800"
      role="alert"
    >
      <svg class="w-5 h-5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fill-rule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
          clip-rule="evenodd"
        />
      </svg>
      <div class="flex-1">
        <p class="text-sm font-medium">{{ errorMessage }}</p>
      </div>
      <button
        class="text-red-500 hover:text-red-700 shrink-0"
        aria-label="Fechar"
        @click="errorMessage = ''"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fill-rule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <div v-if="!sessionId && !loading" class="p-8 text-center bg-muted rounded-lg text-muted-foreground">
      <p>Nenhuma sessão ativa. Crie uma sessão antes de confirmar presenças.</p>
    </div>

    <template v-else-if="sessionId">
      <div class="flex items-center gap-4 mb-4">
        <span class="bg-indigo-500 text-white px-3 py-1 rounded-xl text-[13px] font-semibold">Sessão #{{ sessionId }}</span>
        <span class="text-sm text-foreground font-medium">{{ confirmedCount }} confirmado(s)</span>
      </div>

      <div class="mb-4 max-w-[360px]">
        <SearchInput v-model="search" placeholder="Buscar jogador..." />
      </div>

      <AttendanceTable
        :attendances="attendances"
        :loading="loading"
        :disabled="matchInProgress"
        @update="onUpdate"
      />

      <p v-if="matchInProgress" class="text-xs text-muted-foreground mt-3">
        Alterações bloqueadas: partida em andamento.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
const { getSessions } = useSessions()
const { getAttendance, updateAttendance } = useAttendance()

const sessionId = ref<number | null>(null)
const attendances = ref<any[]>([])
const loading = ref(true)
const search = ref('')
const matchInProgress = ref(false)
const errorMessage = ref('')

const confirmedCount = computed(() =>
  attendances.value.filter((a: any) => a.status === 'ATIVO').length
)

onMounted(async () => {
  try {
    const sessions = await getSessions()
    const active = (sessions as any[])
      .filter((s: any) => s.status !== 'FINISHED')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!active) return

    sessionId.value = active.id
    matchInProgress.value = active.status === 'IN_PROGRESS'
    await fetchAttendance()
  } catch (e) {
    console.error('Erro ao carregar sessão:', e)
    errorMessage.value = 'Erro ao carregar dados da sessão. Tente recarregar a página.'
  } finally {
    loading.value = false
  }
})

async function fetchAttendance() {
  if (!sessionId.value) return
  loading.value = true
  try {
    attendances.value = (await getAttendance(sessionId.value, search.value || undefined)) as any[]
  } catch (e) {
    console.error('Erro ao buscar presenças:', e)
    errorMessage.value = 'Erro ao buscar lista de presenças. Tente novamente.'
  } finally {
    loading.value = false
  }
}

watch(search, () => fetchAttendance())

async function onUpdate(playerId: number, status: string) {
  if (!sessionId.value) return
  errorMessage.value = ''
  try {
    await updateAttendance(sessionId.value, playerId, { status })
    await fetchAttendance()
  } catch (e) {
    console.error('Erro ao atualizar presença:', e)
    errorMessage.value = 'Erro ao atualizar presença do jogador. Tente novamente.'
  }
}
</script>

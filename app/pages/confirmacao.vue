<script setup lang="ts">
const { canManageMatch, canEdit, canConfirmOthers } = usePermissions()
const { getSessions, createSession } = useSessions()
const { getAttendance, updateAttendance } = useAttendance()
const { getSeasons } = useSeasons()
const { getSettings } = useSettings()
const authStore = useAuthStore()

const sessionId = ref<number | null>(null)
const attendances = ref<any[]>([])
const loading = ref(true)
const updating = ref(false)
const creatingSession = ref(false)
const search = ref('')
const matchInProgress = ref(false)
const errorMessage = ref('')
const settings = ref<any>(null)
const updatingMyAttendance = ref(false)


const confirmedCount = computed(() =>
  attendances.value.filter((a: any) => a.status === 'ATIVO').length
)

const confirmedLinhaCount = computed(() =>
  attendances.value.filter(
    (a: any) => a.status === 'ATIVO' && a.player?.position === 'LINHA'
  ).length
)

const minPlayersForDraw = computed(() => {
  if (!settings.value) return Infinity
  return 2 * (settings.value.playersPerTeam ?? 5)
})

const canDraw = computed(() => confirmedLinhaCount.value >= minPlayersForDraw.value)

// Find the current user's attendance record
const myAttendance = computed(() => {
  const userId = authStore.user?.id
  if (!userId) return undefined
  return attendances.value.find((a: any) => a.player?.userId == userId)
})

const myAttendanceStatus = computed(() => myAttendance.value?.status ?? 'AUSENTE')

async function toggleMyAttendance(newStatus: string) {
  if (!sessionId.value || !myAttendance.value) return
  updatingMyAttendance.value = true
  errorMessage.value = ''
  try {
    const playerId = myAttendance.value.player?.id ?? myAttendance.value.playerId
    await updateAttendance(sessionId.value, playerId, { status: newStatus })
    await fetchAttendance(true)
  } catch (e: any) {
    console.error('Erro ao atualizar presença:', e)
    errorMessage.value = 'Erro ao atualizar sua presença. Tente novamente.'
  } finally {
    updatingMyAttendance.value = false
  }
}

onMounted(async () => {
  try {
    const [sessions, settingsData] = await Promise.all([getSessions(), getSettings()])
    settings.value = settingsData

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

async function handleCreateSession() {
  creatingSession.value = true
  errorMessage.value = ''
  try {
    const [seasonsData, settingsData] = await Promise.all([getSeasons(), getSettings()])
    settings.value = settingsData

    const activeSeason = (seasonsData as any[]).find((s: any) => !s.isClosed)
    if (!activeSeason) {
      errorMessage.value = 'Nenhuma temporada ativa encontrada. Crie uma temporada antes.'
      return
    }

    const s = settingsData as any
    const session = await createSession({
      seasonId: activeSeason.id,
      durationMinutes: s?.sessionDurationMin ?? 60,
      matchDurationMinutes: s?.matchDurationMin ?? 10,
    }) as any

    sessionId.value = session.id
    matchInProgress.value = false
    await fetchAttendance()
  } catch (e) {
    console.error('Erro ao criar sessão:', e)
    errorMessage.value = 'Erro ao criar sessão. Tente novamente.'
  } finally {
    creatingSession.value = false
  }
}

async function fetchAttendance(silent = false) {
  if (!sessionId.value) return
  if (!silent) loading.value = true
  try {
    attendances.value = (await getAttendance(sessionId.value, search.value || undefined)) as any[]
  } catch (e) {
    console.error('Erro ao buscar presenças:', e)
    errorMessage.value = 'Erro ao buscar lista de presenças. Tente novamente.'
  } finally {
    if (!silent) loading.value = false
  }
}

watch(search, () => fetchAttendance())

async function onUpdate(playerId: number, status: string) {
  if (!sessionId.value) return
  errorMessage.value = ''
  updating.value = true
  try {
    await updateAttendance(sessionId.value, playerId, { status })
    await fetchAttendance(true)
  } catch (e) {
    console.error('Erro ao atualizar presença:', e)
    errorMessage.value = 'Erro ao atualizar presença do jogador. Tente novamente.'
  } finally {
    updating.value = false
  }
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-5">Confirmação de Presença</h1>
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

    <div v-if="!sessionId && !loading" class="p-8 text-center bg-muted rounded-lg">
      <p class="text-muted-foreground mb-4">Nenhuma sessão ativa. Crie uma sessão para confirmar presenças.</p>
      <BaseButton v-if="canManageMatch()" variant="primary" :loading="creatingSession" @click="handleCreateSession">
        Nova Sessão
      </BaseButton>
    </div>

    <template v-else-if="sessionId">
      <div class="flex items-center gap-4 mb-4">
        <span class="bg-indigo-500 text-white px-3 py-1 rounded-xl text-[13px] font-semibold">Sessão #{{ sessionId }}</span>
        <span class="text-sm text-foreground font-medium">{{ confirmedCount }} confirmado(s)</span>
      </div>

      <!-- Self attendance toggle (all members) -->
      <div v-if="myAttendance !== undefined" class="mb-5 p-4 rounded-lg border bg-card">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-foreground">Minha presença:</span>
          <BaseButton
            v-if="myAttendanceStatus !== 'ATIVO'"
            size="sm"
            variant="primary"
            :loading="updatingMyAttendance"
            :disabled="matchInProgress"
            @click="toggleMyAttendance('ATIVO')"
          >
            Confirmar presença
          </BaseButton>
          <BaseButton
            v-else
            size="sm"
            variant="secondary"
            :loading="updatingMyAttendance"
            :disabled="matchInProgress"
            @click="toggleMyAttendance('AUSENTE')"
          >
            Cancelar presença
          </BaseButton>
          <span class="text-xs text-muted-foreground">
            {{ myAttendanceStatus === 'ATIVO' ? 'Confirmado' : 'Ausente' }}
          </span>
        </div>
      </div>

      <div class="mb-4 max-w-[360px]">
        <SearchInput v-model="search" placeholder="Buscar jogador..." />
      </div>

      <AttendanceTable
        :attendances="attendances"
        :loading="loading"
        :disabled="matchInProgress || updating"
        :show-actions="canEdit('attendance')"
        @update="onUpdate"
      />

      <div v-if="canManageMatch()" class="mt-5">
        <BaseButton
          variant="primary"
          :disabled="!canDraw"
          :title="canDraw ? 'Ir para o sorteio de times' : `Mínimo de ${minPlayersForDraw} jogadores de linha confirmados para sortear`"
          @click="navigateTo('/sorteio')"
        >
          Sortear Times
        </BaseButton>
        <p v-if="!canDraw && confirmedLinhaCount > 0" class="text-xs text-muted-foreground mt-2">
          {{ confirmedLinhaCount }} de {{ minPlayersForDraw }} jogadores de linha confirmados para sortear.
        </p>
      </div>

      <p v-if="matchInProgress" class="text-xs text-muted-foreground mt-3">
        Alterações bloqueadas: partida em andamento.
      </p>
    </template>
  </div>
</template>

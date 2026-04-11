<script setup lang="ts">
const { canManageMatch } = usePermissions()
const { getSessions, getSession, endSession } = useSessions()
const { getTeams } = useTeams()
const { getMatches, startMatch, registerGoal, endMatch, undoGoal, getNextMatch } = useMatches()
const { getSettings } = useSettings()

const matches = ref<any[]>([])
const teams = ref<any[]>([])
const session = ref<any | null>(null)
const sessionId = ref<number | null>(null)
const settings = ref<any>(null)
const loading = ref(false)
const loadingNextMatch = ref(false)
const nextMatchSuggestion = ref<any | null>(null)
const errorMessage = ref<string | null>(null)

// Modal state
const showEndModal = ref(false)
const showWinnerModal = ref(false)
const showFinalizeModal = ref(false)

// Undo goal state
const undoGoalData = ref<{ id: number; playerName: string; teamName: string; minute?: number } | null>(null)
const showUndoGoalModal = ref(false)

// Swap timer state
const showSwapTimer = ref(false)

// Active match ref to access currentMinute
const activeMatchRef = ref<{ currentMinute: number } | null>(null)

let pollInterval: ReturnType<typeof setInterval> | null = null

// --- Computed ---

const isTwoTeamMode = computed(() => teams.value.length === 2)

const finishedMatches = computed(() =>
  matches.value
    .filter((m: any) => m.winnerId != null || m.isDraw === true)
    .sort((a: any, b: any) => b.matchOrder - a.matchOrder),
)

const currentMatch = computed(() =>
  matches.value.find((m: any) => m.winnerId == null && m.isDraw !== true) ?? null,
)

const isFirstMatch = computed(() => finishedMatches.value.length === 0 && !currentMatch.value)

const playedCount = computed(() => finishedMatches.value.length + (currentMatch.value ? 1 : 0))

const hasReachedMaxMatches = computed(() => {
  if (!session.value || isTwoTeamMode.value) return false
  return finishedMatches.value.length >= session.value.totalMatches
})

const showMatchStarter = computed(() =>
  !currentMatch.value && teams.value.length > 0 && !hasReachedMaxMatches.value && canManageMatch(),
)

const showEndSession = computed(() =>
  !currentMatch.value && finishedMatches.value.length > 0 && canManageMatch(),
)

// Session start timestamp for 2-team mode timer
const sessionStartedAt = computed(() => {
  if (!matches.value.length) return null
  const firstMatch = [...matches.value].sort((a, b) => a.matchOrder - b.matchOrder)[0]
  if (!firstMatch?.events?.length) return null
  const startEvent = firstMatch.events.find((e: any) => e.type === 'MATCH_STARTED')
  return startEvent?.timestamp ?? startEvent?.createdAt ?? null
})

function teamName(id: number | null | undefined): string {
  if (id == null) return '?'
  return teams.value.find((t) => t.id === id)?.name ?? `Time #${id}`
}

// --- Error handling ---

function showError(message: string) {
  errorMessage.value = message
  setTimeout(() => {
    if (errorMessage.value === message) errorMessage.value = null
  }, 8000)
}

function extractErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as any).data
    if (data?.message) return typeof data.message === 'string' ? data.message : JSON.stringify(data.message)
  }
  if (e instanceof Error) return e.message
  return 'Erro desconhecido. Tente novamente.'
}

// --- Data fetching ---

async function fetchAll() {
  if (!sessionId.value) return
  try {
    const [fetchedTeams, fetchedMatches, fetchedSession] = await Promise.all([
      getTeams(sessionId.value),
      getMatches(sessionId.value),
      getSession(sessionId.value),
    ])
    if (Array.isArray(fetchedTeams)) teams.value = fetchedTeams
    if (Array.isArray(fetchedMatches)) matches.value = fetchedMatches
    if (fetchedSession) session.value = fetchedSession
  } catch (e) {
    console.error('Erro ao buscar dados:', e)
  }
}

async function fetchNextMatch() {
  if (!sessionId.value || isTwoTeamMode.value) return
  loadingNextMatch.value = true
  nextMatchSuggestion.value = null
  try {
    const result = await getNextMatch(sessionId.value)
    if (result && typeof result === 'object') {
      nextMatchSuggestion.value = result
    }
  } catch (e) {
    console.error('Erro ao buscar próxima partida:', e)
    nextMatchSuggestion.value = null
  } finally {
    loadingNextMatch.value = false
  }
}

// --- Polling ---

function startPolling() {
  if (pollInterval) return
  pollInterval = setInterval(fetchAll, 5000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

watch(currentMatch, (match) => {
  if (match) startPolling()
  else stopPolling()
}, { immediate: true })

// --- Lifecycle ---

onMounted(async () => {
  try {
    const sessions = await getSessions()
    const active = (sessions as any[])
      .filter((s: any) => s.status !== 'FINISHED')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!active) return
    sessionId.value = active.id
    session.value = active

    settings.value = await getSettings()
    await fetchAll()

    if (!currentMatch.value && finishedMatches.value.length > 0) {
      await fetchNextMatch()
    }
  } catch (e) {
    console.error('Erro ao inicializar:', e)
    showError('Erro ao carregar dados da sessão. Verifique sua conexão e tente novamente.')
  }
})

onUnmounted(() => {
  stopPolling()
})

// --- Handlers ---

async function handleSwapTimerUp() {
  showSwapTimer.value = false
  if (nextMatchSuggestion.value) {
    await handleStartMatch(
      nextMatchSuggestion.value.teamA?.id ?? nextMatchSuggestion.value.teamAId,
      nextMatchSuggestion.value.teamB?.id ?? nextMatchSuggestion.value.teamBId,
    )
  }
}

async function handleStartMatch(teamAId: number, teamBId: number) {
  if (!sessionId.value) return
  loading.value = true
  errorMessage.value = null
  showSwapTimer.value = false
  try {
    await startMatch(sessionId.value, { teamAId, teamBId })
    nextMatchSuggestion.value = null
    await fetchAll()
  } catch (e) {
    console.error('Erro ao iniciar partida:', e)
    showError('Erro ao iniciar partida: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function handleGoal(playerId: number, teamId: number) {
  if (!currentMatch.value) return
  const minute = activeMatchRef.value?.currentMinute ?? 1
  loading.value = true
  errorMessage.value = null
  try {
    await registerGoal(currentMatch.value.id, { playerId, teamId, minute })
    await fetchAll()
  } catch (e) {
    console.error('Erro ao registrar gol:', e)
    showError('Erro ao registrar gol: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function handleUndoGoalClick(goal: { id: number; playerName: string; teamName: string; minute?: number }) {
  undoGoalData.value = goal
  showUndoGoalModal.value = true
}

async function confirmUndoGoal() {
  if (!currentMatch.value || !undoGoalData.value) return
  loading.value = true
  errorMessage.value = null
  showUndoGoalModal.value = false
  try {
    await undoGoal(currentMatch.value.id, undoGoalData.value.id)
    undoGoalData.value = null
    await fetchAll()
  } catch (e) {
    console.error('Erro ao desfazer gol:', e)
    showError('Erro ao desfazer gol: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function handleEndMatchClick() {
  if (!currentMatch.value) return

  // In 2-team mode, no winner selection needed for draws
  if (isTwoTeamMode.value) {
    showEndModal.value = true
    return
  }

  const isFirst = finishedMatches.value.length === 0
  const isDraw = (currentMatch.value.scoreA ?? 0) === (currentMatch.value.scoreB ?? 0)

  if (isFirst && isDraw) {
    showWinnerModal.value = true
  } else {
    showEndModal.value = true
  }
}

async function confirmEndMatch(winnerId: number | null | undefined) {
  if (!currentMatch.value) return
  loading.value = true
  errorMessage.value = null
  showEndModal.value = false
  showWinnerModal.value = false
  try {
    await endMatch(currentMatch.value.id, winnerId != null ? { winnerId } : {})
    await fetchAll()
    if (!currentMatch.value && !isTwoTeamMode.value) {
      await fetchNextMatch()
      if (settings.value?.teamSwapEnabled) {
        showSwapTimer.value = true
      }
    }
  } catch (e) {
    console.error('Erro ao encerrar partida:', e)
    showError('Erro ao encerrar partida: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function handleFinalizeSession() {
  if (!sessionId.value) return
  loading.value = true
  errorMessage.value = null
  showFinalizeModal.value = false
  try {
    const result = await endSession(sessionId.value) as any
    const championId = result?.champion?.id
    navigateTo(`/campeoes/registrar?sessionId=${sessionId.value}${championId ? `&championId=${championId}` : ''}`)
  } catch (e) {
    console.error('Erro ao encerrar sessão:', e)
    showError('Erro ao encerrar sessão: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-[900px] mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold text-foreground mb-7">Partida ao Vivo</h1>

    <div v-if="errorMessage" class="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
      <span>{{ errorMessage }}</span>
      <button class="ml-3 text-red-600 hover:text-red-800 font-bold" @click="errorMessage = null">&times;</button>
    </div>

    <div v-if="!loading && teams.length === 0" class="text-center bg-muted rounded-lg py-10 px-6 text-muted-foreground">
      <p>Realize o sorteio antes de iniciar partidas.</p>
      <NuxtLink to="/sorteio">
        <BaseButton variant="primary" size="md" class="mt-3">Ir para Sorteio</BaseButton>
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Session info bar (rotation mode only) -->
      <MatchesSessionInfoBar
        v-if="session && !isTwoTeamMode"
        :duration-minutes="session.durationMinutes"
        :match-duration-minutes="session.matchDurationMinutes"
        :total-matches="session.totalMatches"
        :played-count="playedCount"
        :reached-max="hasReachedMaxMatches"
      />

      <section class="mb-9">
        <h2 class="text-xl font-semibold text-foreground mb-4 pb-2 border-b-2 border-border">
          Partida Atual
          <span v-if="session && !isTwoTeamMode" class="text-base font-normal text-muted-foreground ml-2">
            ({{ finishedMatches.length + 1 }} de {{ session.totalMatches }})
          </span>
        </h2>

        <!-- Swap timer (rotation mode only) -->
        <MatchesSwapTimer
          v-if="showSwapTimer && !isTwoTeamMode"
          :duration-seconds="(settings?.teamSwapTimeMin ?? 2) * 60"
          :active="showSwapTimer"
          class="mb-4"
          @time-up="handleSwapTimerUp"
        />

        <!-- Match starter -->
        <MatchesMatchStarter
          v-if="showMatchStarter"
          :teams="teams"
          :is-first-match="isFirstMatch"
          :next-match-suggestion="nextMatchSuggestion"
          :loading-next-match="loadingNextMatch"
          :loading="loading"
          :two-team-mode="isTwoTeamMode"
          @start="handleStartMatch"
        />

        <!-- Max matches reached (rotation mode only) -->
        <div v-if="!currentMatch && teams.length > 0 && hasReachedMaxMatches" class="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
          <p class="text-amber-800 font-medium">Todas as partidas da sessão foram realizadas.</p>
          <p class="text-amber-600 text-sm mt-1">Encerre a sessão para salvar os resultados e atualizar as estatísticas.</p>
        </div>

        <!-- Active match -->
        <MatchesActiveMatch
          v-if="currentMatch"
          ref="activeMatchRef"
          :match="currentMatch"
          :teams="teams"
          :loading="loading"
          :disabled="!canManageMatch()"
          :two-team-mode="isTwoTeamMode"
          :session-started-at="sessionStartedAt"
          :session-duration-minutes="session?.durationMinutes"
          @goal="handleGoal"
          @undo-goal="handleUndoGoalClick"
          @end-match="handleEndMatchClick"
          @end-session="showFinalizeModal = true"
        />
      </section>

      <!-- Finished matches -->
      <MatchesFinishedMatchesList :matches="finishedMatches" :teams="teams" />

      <!-- End session -->
      <MatchesEndSessionBar
        v-if="showEndSession"
        :loading="loading"
        @end-session="showFinalizeModal = true"
      />
    </template>

    <!-- Modals -->
    <MatchesUndoGoalModal
      :show="showUndoGoalModal"
      :goal="undoGoalData"
      :loading="loading"
      @close="showUndoGoalModal = false"
      @confirm="confirmUndoGoal"
    />

    <MatchesWinnerSelectModal
      :show="showWinnerModal"
      :loading="loading"
      :team-a-name="teamName(currentMatch?.teamA?.id ?? currentMatch?.teamAId)"
      :team-b-name="teamName(currentMatch?.teamB?.id ?? currentMatch?.teamBId)"
      :team-a-id="currentMatch?.teamA?.id ?? currentMatch?.teamAId ?? null"
      :team-b-id="currentMatch?.teamB?.id ?? currentMatch?.teamBId ?? null"
      @close="showWinnerModal = false"
      @select="confirmEndMatch"
    />

    <MatchesEndMatchModal
      :show="showEndModal"
      :loading="loading"
      @close="showEndModal = false"
      @confirm="confirmEndMatch(null)"
    />

    <MatchesEndSessionModal
      :show="showFinalizeModal"
      :loading="loading"
      @close="showFinalizeModal = false"
      @confirm="handleFinalizeSession"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  Match,
  Team,
  Session,
  LateGoalMatchOption,
  LateGoalRequest,
  SessionReviewMatch,
  SessionReviewGoal,
  CreateSubstitutionRequest,
} from '~/types/match'
import type { AvailablePoolDto } from '~/composables/useSubstitution'

interface Settings {
  teamSwapEnabled?: boolean
  teamSwapTimeMin?: number
}

interface UndoGoalContextLocal {
  id: number
  playerName: string | null
  teamName: string
  minute?: number | null
}

interface NextMatchSuggestion {
  teamA?: { id: number } | null
  teamB?: { id: number } | null
  teamAId?: number
  teamBId?: number
}

interface SessionListItem {
  id: number
  status: string
  createdAt: string
}

interface EndSessionResult {
  champion?: { id?: number } | null
}

const { canManageMatch } = usePermissions()
const { getSessions, getSession, endSession } = useSessions()
const { getTeams } = useTeams()
const {
  getMatches,
  startMatch,
  registerGoal,
  endMatch,
  undoGoal,
  getNextMatch,
  registerLateGoal,
  undoLateGoal: _undoLateGoal,
} = useMatches()
void _undoLateGoal
const { getSettings } = useSettings()
const { createSubstitution, getAvailablePool } = useSubstitution()

const matches = ref<Match[]>([])
const teams = ref<Team[]>([])
const session = ref<Session | null>(null)
const sessionId = ref<number | null>(null)
const settings = ref<Settings | null>(null)
const loading = ref(false)
const loadingNextMatch = ref(false)
const nextMatchSuggestion = ref<NextMatchSuggestion | null>(null)
const errorMessage = ref<string | null>(null)

const showEndModal = ref(false)
const showWinnerModal = ref(false)
const showFinalizeModal = ref(false)

const undoGoalData = ref<UndoGoalContextLocal | null>(null)
const showUndoGoalModal = ref(false)

const showSwapTimer = ref(false)

const showLateGoalModal = ref(false)
const lateGoalMatchId = ref<number | null>(null)

const showSessionReview = ref(false)

const showSubstitutionModal = ref(false)
const availablePool = ref<AvailablePoolDto>({ reserves: [], waitingTeams: [] })

const activeMatchRef = ref<{
  currentMinute: number
  elapsedSeconds: number
  isTimeUp: boolean
} | null>(null)

let pollInterval: ReturnType<typeof setInterval> | null = null

const isTwoTeamMode = computed(() => teams.value.length === 2)

const finishedMatches = computed<Match[]>(() =>
  matches.value
    .filter((m) => m.winnerId != null || m.isDraw === true)
    .sort((a, b) => b.matchOrder - a.matchOrder),
)

const currentMatch = computed<Match | null>(
  () => matches.value.find((m) => m.winnerId == null && m.isDraw !== true) ?? null,
)

const effectiveTeams = computed<Team[]>(() => {
  const match = currentMatch.value
  if (!match || !match.matchPlayers?.length) return teams.value
  const activeByTeam = new Map<number, { id: number; name: string }[]>()
  for (const mp of match.matchPlayers) {
    if (mp.leftMinute != null) continue
    const player = mp.player
    if (!player) continue
    const list = activeByTeam.get(mp.teamId) ?? []
    list.push({ id: player.id, name: player.name })
    activeByTeam.set(mp.teamId, list)
  }
  return teams.value.map((t) => {
    const active = activeByTeam.get(t.id)
    if (!active) return t
    return { ...t, players: active as Team['players'] }
  })
})

const isFirstMatch = computed(() => finishedMatches.value.length === 0 && !currentMatch.value)

const playedCount = computed(() => finishedMatches.value.length + (currentMatch.value ? 1 : 0))

const hasReachedMaxMatches = computed(() => {
  if (!session.value || isTwoTeamMode.value) return false
  return finishedMatches.value.length >= session.value.totalMatches
})

const showMatchStarter = computed(
  () => !currentMatch.value && teams.value.length > 0 && !hasReachedMaxMatches.value && canManageMatch(),
)

const showEndSession = computed(
  () => !currentMatch.value && finishedMatches.value.length > 0 && canManageMatch(),
)

const showLateGoalOption = computed(
  () =>
    !currentMatch.value &&
    finishedMatches.value.length > 0 &&
    !showSwapTimer.value &&
    canManageMatch(),
)

const lastFinishedMatchInfo = computed<{
  id: number
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
} | null>(() => {
  const last = finishedMatches.value[0]
  if (!last) return null
  return {
    id: last.id,
    teamAName: teamName(last.teamAId),
    teamBName: teamName(last.teamBId),
    scoreA: last.scoreA,
    scoreB: last.scoreB,
  }
})

const lateGoalMatchOptions = computed<LateGoalMatchOption[]>(() =>
  finishedMatches.value.map((m) => ({
    id: m.id,
    teamAId: m.teamAId,
    teamAName: teamName(m.teamAId),
    teamBId: m.teamBId,
    teamBName: teamName(m.teamBId),
    scoreA: m.scoreA,
    scoreB: m.scoreB,
  })),
)

const reviewMatches = computed<SessionReviewMatch[]>(() => {
  const ordered = [...finishedMatches.value].sort((a, b) => a.matchOrder - b.matchOrder)
  return ordered.map((m) => {
    const goalRows: SessionReviewGoal[] = (m.goals ?? []).map((g) => {
      const team = teams.value.find((t) => t.id === g.teamId)
      const playerName = g.playerId !== null ? resolvePlayerName(g.playerId) : null
      return {
        id: g.id,
        playerName,
        teamName: team?.name ?? 'Time',
        source: g.source ?? 'LIVE',
        minute: g.minute,
      }
    })
    return {
      id: m.id,
      matchOrder: m.matchOrder,
      teamAName: teamName(m.teamAId),
      teamBName: teamName(m.teamBId),
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      goals: goalRows,
    }
  })
})

const sessionStartedAt = computed<string | null>(() => {
  if (!matches.value.length) return null
  const firstMatch = [...matches.value].sort((a, b) => a.matchOrder - b.matchOrder)[0]
  if (!firstMatch?.events?.length) return null
  const startEvent = firstMatch.events.find((e) => e.type === 'MATCH_STARTED')
  if (!startEvent) return null
  const ts = startEvent.timestamp
  return typeof ts === 'string' ? ts : null
})

function teamName(id: number | null | undefined): string {
  if (id == null) return '?'
  return teams.value.find((t) => t.id === id)?.name ?? `Time #${id}`
}

function resolvePlayerName(playerId: number): string | null {
  for (const t of teams.value) {
    const found = t.players?.find((p) => p.id === playerId)
    if (found) return found.name
  }
  return null
}

function showError(message: string) {
  errorMessage.value = message
  setTimeout(() => {
    if (errorMessage.value === message) errorMessage.value = null
  }, 8000)
}

function extractErrorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'data' in e) {
    const data = (e as { data?: { message?: string | string[] } }).data
    if (data?.message) {
      return typeof data.message === 'string' ? data.message : JSON.stringify(data.message)
    }
  }
  if (e instanceof Error) return e.message
  return 'Erro desconhecido. Tente novamente.'
}

async function fetchAll() {
  if (!sessionId.value) return
  try {
    const [fetchedTeams, fetchedMatches, fetchedSession] = await Promise.all([
      getTeams(sessionId.value),
      getMatches(sessionId.value),
      getSession(sessionId.value),
    ])
    if (Array.isArray(fetchedTeams)) teams.value = fetchedTeams as Team[]
    if (Array.isArray(fetchedMatches)) matches.value = fetchedMatches as Match[]
    if (fetchedSession) session.value = fetchedSession as Session
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
      nextMatchSuggestion.value = result as NextMatchSuggestion
    }
  } catch (e) {
    console.error('Erro ao buscar próxima partida:', e)
    nextMatchSuggestion.value = null
  } finally {
    loadingNextMatch.value = false
  }
}

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

const isMatchTimeUp = computed(() => activeMatchRef.value?.isTimeUp ?? false)

watch(
  [currentMatch, isMatchTimeUp],
  ([match, timeUp]) => {
    if (match && !timeUp) startPolling()
    else stopPolling()
  },
  { immediate: true },
)

onMounted(async () => {
  try {
    const sessions = (await getSessions()) as SessionListItem[]
    const active = sessions
      .filter((s) => s.status !== 'FINISHED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!active) return
    sessionId.value = active.id
    session.value = active as unknown as Session

    settings.value = (await getSettings()) as Settings
    await fetchAll()
    await fetchAvailablePool()

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

async function handleSwapTimerUp() {
  showSwapTimer.value = false
  if (nextMatchSuggestion.value) {
    const teamAId =
      nextMatchSuggestion.value.teamA?.id ?? nextMatchSuggestion.value.teamAId ?? null
    const teamBId =
      nextMatchSuggestion.value.teamB?.id ?? nextMatchSuggestion.value.teamBId ?? null
    if (teamAId !== null && teamBId !== null) {
      await handleStartMatch(teamAId, teamBId)
    }
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
    await fetchAvailablePool()
  } catch (e) {
    console.error('Erro ao iniciar partida:', e)
    showError('Erro ao iniciar partida: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function handleGoal(playerId: number, teamId: number) {
  if (!currentMatch.value) return
  const minute = activeMatchRef.value?.elapsedSeconds ?? 0
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

function handleUndoGoalClick(goal: UndoGoalContextLocal) {
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
    await fetchAvailablePool()
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
    const result = (await endSession(sessionId.value)) as EndSessionResult
    const championId = result?.champion?.id
    navigateTo(
      `/campeoes/registrar?sessionId=${sessionId.value}${championId ? `&championId=${championId}` : ''}`,
    )
  } catch (e) {
    console.error('Erro ao encerrar sessão:', e)
    showError('Erro ao encerrar sessão: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function handleOpenLateGoal(matchId: number) {
  lateGoalMatchId.value = matchId
  showLateGoalModal.value = true
}

async function handleConfirmLateGoal(payload: LateGoalRequest & { matchId: number }) {
  loading.value = true
  errorMessage.value = null
  try {
    const body: LateGoalRequest = { teamId: payload.teamId }
    if (payload.reason) body.reason = payload.reason
    await registerLateGoal(payload.matchId, body)
    showLateGoalModal.value = false
    lateGoalMatchId.value = null
    await fetchAll()
  } catch (e) {
    console.error('Erro ao registrar gol tardio:', e)
    showError('Erro ao registrar gol tardio: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function handleOpenSessionReview() {
  showSessionReview.value = true
}

async function fetchAvailablePool() {
  if (!sessionId.value) return
  try {
    const pool = await getAvailablePool(sessionId.value)
    if (pool) availablePool.value = pool
  } catch (e) {
    console.error('Erro ao buscar pool de substituicao:', e)
  }
}

const substitutionActiveMatch = computed(() => {
  if (!currentMatch.value) return null
  const teamA = effectiveTeams.value.find((t) => t.id === currentMatch.value!.teamAId)
  const teamB = effectiveTeams.value.find((t) => t.id === currentMatch.value!.teamBId)
  if (!teamA || !teamB) return null
  return {
    id: currentMatch.value.id,
    teamAId: currentMatch.value.teamAId,
    teamBId: currentMatch.value.teamBId,
    teamA: {
      id: teamA.id,
      name: teamA.name,
      players: normalizeTeamPlayers(teamA.players),
    },
    teamB: {
      id: teamB.id,
      name: teamB.name,
      players: normalizeTeamPlayers(teamB.players),
    },
  }
})

function normalizeTeamPlayers(
  raw: unknown[] | undefined,
): { id: number; name: string }[] {
  if (!raw) return []
  return raw
    .map((p) => {
      const entry = p as {
        id?: number
        name?: string
        player?: { id: number; name: string }
      }
      if (entry.player && typeof entry.player === 'object') {
        return { id: entry.player.id, name: entry.player.name }
      }
      return { id: entry.id ?? 0, name: entry.name ?? '' }
    })
    .filter((p) => p.id > 0)
}

const hasAvailablePool = computed(
  () => availablePool.value.reserves.length + availablePool.value.waitingTeams.length > 0,
)

const availablePoolCount = computed(() => {
  const waiting = availablePool.value.waitingTeams.reduce((acc, wt) => acc + wt.players.length, 0)
  return availablePool.value.reserves.length + waiting
})

async function handleOpenSubstitution() {
  await fetchAvailablePool()
  showSubstitutionModal.value = true
}

async function handleConfirmSubstitution(payload: CreateSubstitutionRequest) {
  if (!sessionId.value) return
  loading.value = true
  errorMessage.value = null
  try {
    await createSubstitution(sessionId.value, payload)
    showSubstitutionModal.value = false
    await fetchAll()
    await fetchAvailablePool()
  } catch (e) {
    console.error('Erro ao criar substituicao:', e)
    showError('Erro ao criar substituicao: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

function handleAddLateGoalFromReview(matchId: number) {
  showSessionReview.value = false
  lateGoalMatchId.value = matchId
  showLateGoalModal.value = true
}
</script>

<template>
  <div class="max-w-[900px] mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold text-foreground mb-7">Partida ao Vivo</h1>

    <div
      v-if="errorMessage"
      class="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between"
    >
      <span>{{ errorMessage }}</span>
      <button
        class="ml-3 text-red-600 hover:text-red-800 font-bold"
        @click="errorMessage = null"
      >
        &times;
      </button>
    </div>

    <div
      v-if="!loading && teams.length === 0"
      class="text-center bg-muted rounded-lg py-10 px-6 text-muted-foreground"
    >
      <p>Realize o sorteio antes de iniciar partidas.</p>
      <NuxtLink to="/sorteio">
        <BaseButton variant="primary" size="md" class="mt-3">Ir para Sorteio</BaseButton>
      </NuxtLink>
    </div>

    <template v-else>
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
          <span
            v-if="session && !isTwoTeamMode"
            class="text-base font-normal text-muted-foreground ml-2"
          >
            ({{ finishedMatches.length + 1 }} de {{ session.totalMatches }})
          </span>
        </h2>

        <MatchesSwapTimer
          v-if="showSwapTimer && !isTwoTeamMode"
          :duration-seconds="(settings?.teamSwapTimeMin ?? 2) * 60"
          :active="showSwapTimer"
          class="mb-4"
          @time-up="handleSwapTimerUp"
        />

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

        <div
          v-if="!currentMatch && teams.length > 0 && hasReachedMaxMatches"
          class="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center"
        >
          <p class="text-amber-800 font-medium">
            Todas as partidas da sessão foram realizadas.
          </p>
          <p class="text-amber-600 text-sm mt-1">
            Encerre a sessão para salvar os resultados e atualizar as estatísticas.
          </p>
        </div>

        <MatchesActiveMatch
          v-if="currentMatch"
          ref="activeMatchRef"
          :match="currentMatch"
          :teams="effectiveTeams"
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

        <div v-if="currentMatch && canManageMatch()" class="mt-3">
          <MatchesSubstitutionButton
            :available-count="availablePoolCount"
            :disabled="loading"
            @open="handleOpenSubstitution"
          />
        </div>

        <div v-if="showLateGoalOption" class="mt-4">
          <MatchesLateGoalButton
            :last-finished-match="lastFinishedMatchInfo"
            :disabled="loading"
            @open-late-goal="handleOpenLateGoal"
          />
        </div>
      </section>

      <MatchesFinishedMatchesList :matches="finishedMatches" :teams="teams" />

      <MatchesEndSessionBar
        v-if="showEndSession"
        :loading="loading"
        @end-session="showFinalizeModal = true"
        @review-session="handleOpenSessionReview"
      />
    </template>

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
      :team-a-name="teamName(currentMatch?.teamAId)"
      :team-b-name="teamName(currentMatch?.teamBId)"
      :team-a-id="currentMatch?.teamAId ?? null"
      :team-b-id="currentMatch?.teamBId ?? null"
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

    <MatchesLateGoalModal
      v-if="showLateGoalModal"
      :matches="lateGoalMatchOptions"
      :initial-match-id="lateGoalMatchId"
      :loading="loading"
      @confirm="
        (p) => handleConfirmLateGoal({ ...p, matchId: p.matchId })
      "
      @close="showLateGoalModal = false"
    />

    <MatchesSessionReviewPanel
      v-if="showSessionReview"
      :matches="reviewMatches"
      :disabled="loading"
      @add-late-goal="handleAddLateGoalFromReview"
      @close="showSessionReview = false"
    />

    <MatchesSubstitutionModal
      :show="showSubstitutionModal"
      :teams="teams"
      :active-match="substitutionActiveMatch"
      :available-pool="availablePool"
      :loading="loading"
      :current-minute="activeMatchRef?.elapsedSeconds ?? null"
      @close="showSubstitutionModal = false"
      @confirm="handleConfirmSubstitution"
    />
  </div>
</template>

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
<div v-if="session" class="mb-6 flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-5 py-3 text-sm text-slate-700">
        <span>
          <strong>Sessão:</strong> {{ session.durationMinutes }} min total
        </span>
        <span class="text-slate-300">|</span>
        <span>
          <strong>Partida:</strong> {{ session.matchDurationMinutes }} min cada
        </span>
        <span class="text-slate-300">|</span>
        <span>
          <strong>Total de partidas:</strong> {{ session.totalMatches }}
        </span>
        <span class="text-slate-300">|</span>
        <span :class="matchCountColor">
          <strong>Progresso:</strong> {{ finishedMatches.length + (currentMatch ? 1 : 0) }} de {{ session.totalMatches }}
        </span>
      </div>
<section class="mb-9">
        <h2 class="text-xl font-semibold text-foreground mb-4 pb-2 border-b-2 border-border">
          Partida Atual
          <span v-if="session" class="text-base font-normal text-muted-foreground ml-2">
            ({{ finishedMatches.length + 1 }} de {{ session.totalMatches }})
          </span>
        </h2>
<div v-if="!currentMatch && teams.length > 0 && !hasReachedMaxMatches && canManageMatch()" class="bg-white border rounded-lg p-5 flex flex-col gap-4">
<template v-if="isFirstMatch">
            <p class="text-sm text-muted-foreground mb-1">Selecione os times para a primeira partida:</p>
            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-foreground">Time A</label>
                <select v-model="selectedTeamA" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option :value="null" disabled>Selecione...</option>
                  <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-sm font-semibold text-foreground">Time B</label>
                <select v-model="selectedTeamB" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option :value="null" disabled>Selecione...</option>
                  <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
            </div>
            <BaseButton
              variant="primary"
              size="md"
              :loading="loading"
              :disabled="!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB"
              @click="handleStartMatch"
            >
              Iniciar Partida
            </BaseButton>
          </template>
<template v-else>
            <div v-if="loadingNextMatch" class="text-center py-4 text-muted-foreground text-sm">
              Carregando próxima partida...
            </div>
            <template v-else-if="nextMatchSuggestion">
              <p class="text-sm text-muted-foreground mb-1">Próxima partida sugerida pelo rodízio:</p>
              <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 rounded-md bg-blue-50 text-blue-800">
                <span class="text-lg font-semibold text-right">{{ nextMatchSuggestion.teamA?.name ?? teamName(nextMatchSuggestion.teamA?.id ?? nextMatchSuggestion.teamAId) }}</span>
                <span class="text-sm font-bold text-blue-500 text-center">vs</span>
                <span class="text-lg font-semibold text-left">{{ nextMatchSuggestion.teamB?.name ?? teamName(nextMatchSuggestion.teamB?.id ?? nextMatchSuggestion.teamBId) }}</span>
              </div>
              <BaseButton
                variant="primary"
                size="md"
                :loading="loading"
                @click="handleStartSuggestedMatch"
              >
                Iniciar Partida
              </BaseButton>
            </template>
            <div v-else class="text-center py-4 text-muted-foreground text-sm">
              <p>Não foi possível obter a próxima partida automaticamente.</p>
              <p class="text-xs mt-1">Selecione manualmente abaixo:</p>
              <div class="grid grid-cols-2 gap-4 mt-3 text-left">
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-foreground">Time A</label>
                  <select v-model="selectedTeamA" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option :value="null" disabled>Selecione...</option>
                    <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-sm font-semibold text-foreground">Time B</label>
                  <select v-model="selectedTeamB" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option :value="null" disabled>Selecione...</option>
                    <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                </div>
              </div>
              <BaseButton
                variant="primary"
                size="md"
                class="mt-3"
                :loading="loading"
                :disabled="!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB"
                @click="handleStartMatch"
              >
                Iniciar Partida
              </BaseButton>
            </div>
          </template>
        </div>
<div v-if="!currentMatch && teams.length > 0 && hasReachedMaxMatches" class="bg-amber-50 border border-amber-200 rounded-lg p-5 text-center">
            <p class="text-amber-800 font-medium">Todas as partidas da sessão foram realizadas.</p>
            <p class="text-amber-600 text-sm mt-1">Encerre a sessão para salvar os resultados e atualizar as estatísticas.</p>
          </div>
<template v-if="currentMatch">
<div class="flex items-center justify-center gap-4 mb-4 py-3 px-5 bg-white border rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tempo</span>
              <span
                :class="[
                  'font-mono text-3xl font-bold tabular-nums',
                  isTimeUp ? 'text-red-600 animate-pulse' : 'text-foreground',
                ]"
              >
                {{ timerDisplay }}
              </span>
            </div>
            <span v-if="isTimeUp" class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
              Tempo esgotado
            </span>
            <span v-else-if="session" class="text-xs text-muted-foreground">
              / {{ session.matchDurationMinutes }}:00
            </span>
          </div>

          <MatchesMatchBoard
            :match="currentMatch"
            :teams="teams"
            :disabled="loading || !canManageMatch()"
            @goal="handleGoal"
          />

          <div v-if="canManageMatch()" class="flex justify-end mt-4">
            <BaseButton
              variant="danger"
              size="md"
              :loading="loading"
              @click="handleEndMatchClick"
            >
              Encerrar Partida
            </BaseButton>
          </div>
<div class="mt-2 bg-white border rounded-lg p-4">
            <h3 class="text-base font-semibold text-foreground mb-2.5 mt-0">Eventos</h3>
            <MatchesMatchTimeline :events="currentMatch.events ?? []" :teams="teams" />
          </div>
        </template>
      </section>
<section v-if="finishedMatches.length > 0" class="mb-9">
        <h2 class="text-xl font-semibold text-foreground mb-4 pb-2 border-b-2 border-border">
          Partidas Concluídas
          <span class="text-base font-normal text-muted-foreground ml-1">({{ finishedMatches.length }})</span>
        </h2>
        <div class="flex flex-col gap-2">
          <div
            v-for="match in finishedMatches"
            :key="match.id"
            class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 rounded-md bg-muted text-foreground"
          >
            <span :class="['font-medium text-right', winnerClass(match, 'A')]">
              {{ teamName(match.teamAId ?? match.teamA?.id) }}
              <span v-if="isWinner(match, 'A')" class="ml-1 text-xs text-green-600 font-bold">V</span>
            </span>
            <span class="text-lg font-bold text-foreground text-center tracking-wider">
              {{ match.scoreA ?? 0 }} &times; {{ match.scoreB ?? 0 }}
            </span>
            <span :class="['font-medium text-left', winnerClass(match, 'B')]">
              <span v-if="isWinner(match, 'B')" class="mr-1 text-xs text-green-600 font-bold">V</span>
              {{ teamName(match.teamBId ?? match.teamB?.id) }}
            </span>
          </div>
        </div>
      </section>
<section v-if="!currentMatch && finishedMatches.length > 0 && canManageMatch()" class="mb-9 pt-4 border-t border-border">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-foreground">Encerrar Sessão</h2>
            <p class="text-sm text-muted-foreground mt-0.5">
              Finaliza a sessão, salva os resultados, atualiza ELO e estatísticas dos jogadores.
            </p>
          </div>
          <BaseButton
            variant="danger"
            size="md"
            :loading="loading"
            @click="showFinalizeModal = true"
          >
            Encerrar Sessão
          </BaseButton>
        </div>
      </section>
    </template>
<BaseModal :show="showWinnerModal" title="Empate -- Escolha o vencedor" @close="showWinnerModal = false">
      <p class="text-foreground text-sm mb-4">
        A primeira partida terminou em empate. Escolha o time vencedor para fins de rodízio (ambos os times recebem 1 ponto):
      </p>
      <div class="flex gap-3 justify-center">
        <BaseButton
          variant="primary"
          size="md"
          :loading="loading"
          @click="confirmEndMatch(currentMatch?.teamA?.id ?? currentMatch?.teamAId)"
        >
          {{ teamName(currentMatch?.teamA?.id ?? currentMatch?.teamAId) }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="md"
          :loading="loading"
          @click="confirmEndMatch(currentMatch?.teamB?.id ?? currentMatch?.teamBId)"
        >
          {{ teamName(currentMatch?.teamB?.id ?? currentMatch?.teamBId) }}
        </BaseButton>
      </div>
    </BaseModal>
<BaseModal :show="showEndModal" title="Encerrar Partida" @close="showEndModal = false">
      <p class="text-foreground text-sm">Deseja realmente encerrar a partida atual?</p>
      <template #footer>
        <BaseButton variant="secondary" size="sm" @click="showEndModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" size="sm" :loading="loading" @click="confirmEndMatch(null)">
          Encerrar
        </BaseButton>
      </template>
    </BaseModal>
<BaseModal :show="showFinalizeModal" title="Encerrar Sessão" @close="showFinalizeModal = false">
      <p class="text-foreground text-sm">
        Deseja realmente encerrar a sessão? Essa ação vai salvar todos os resultados, atualizar o ELO dos jogadores e finalizar a sessão.
      </p>
      <template #footer>
        <BaseButton variant="secondary" size="sm" @click="showFinalizeModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" size="sm" :loading="loading" @click="handleFinalizeSession">
          Confirmar Encerramento
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const { canManageMatch } = usePermissions()
const { getSessions, getSession, endSession } = useSessions()
const { getTeams } = useTeams()
const { getMatches, startMatch, registerGoal, endMatch, getNextMatch } = useMatches()

const matches = ref<any[]>([])
const teams = ref<any[]>([])
const session = ref<any | null>(null)
const sessionId = ref<number | null>(null)
const loading = ref(false)
const loadingNextMatch = ref(false)
const showEndModal = ref(false)
const showWinnerModal = ref(false)
const showFinalizeModal = ref(false)
const selectedTeamA = ref<number | null>(null)
const selectedTeamB = ref<number | null>(null)
const nextMatchSuggestion = ref<any | null>(null)
const errorMessage = ref<string | null>(null)

let pollInterval: ReturnType<typeof setInterval> | null = null
let timerInterval: ReturnType<typeof setInterval> | null = null
const elapsedSeconds = ref(0)

const timerDisplay = computed(() => {
  const mins = Math.floor(elapsedSeconds.value / 60)
  const secs = elapsedSeconds.value % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})

const currentMinute = computed(() => Math.floor(elapsedSeconds.value / 60) + 1)

const isTimeUp = computed(() => {
  if (!session.value?.matchDurationMinutes) return false
  return elapsedSeconds.value >= session.value.matchDurationMinutes * 60
})

function getMatchStartTimestamp(match: any): string | null {
  if (!match?.events?.length) return null
  const startEvent = match.events.find((e: any) => e.type === 'MATCH_STARTED')
  return startEvent?.timestamp ?? startEvent?.createdAt ?? null
}

function startTimer() {
  stopTimer()
  const ts = getMatchStartTimestamp(currentMatch.value)
  if (!ts) {
    elapsedSeconds.value = 0
    return
  }
  const startTime = new Date(ts).getTime()
  elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - startTime) / 1000))
  timerInterval = setInterval(() => {
    elapsedSeconds.value = Math.max(0, Math.floor((Date.now() - startTime) / 1000))
  }, 1000)
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }
  elapsedSeconds.value = 0
}

const finishedMatches = computed(() =>
  matches.value
    .filter((m: any) => m.winnerId != null || m.isDraw === true)
    .sort((a: any, b: any) => b.matchOrder - a.matchOrder),
)

const currentMatch = computed(() =>
  matches.value.find((m: any) => m.winnerId == null && m.isDraw !== true) ?? null,
)

const isFirstMatch = computed(() => finishedMatches.value.length === 0 && !currentMatch.value)

const matchCountColor = computed(() => {
  if (!session.value) return 'text-slate-700'
  const played = finishedMatches.value.length + (currentMatch.value ? 1 : 0)
  if (played >= session.value.totalMatches) return 'text-red-600 font-semibold'
  return 'text-slate-700'
})

const hasReachedMaxMatches = computed(() => {
  if (!session.value) return false
  return finishedMatches.value.length >= session.value.totalMatches
})

function teamName(id: number | null | undefined): string {
  if (id == null) return '?'
  return teams.value.find((t) => t.id === id)?.name ?? `Time #${id}`
}

function isWinner(match: any, side: 'A' | 'B'): boolean {
  if (match.isDraw) return false
  const teamId = side === 'A' ? (match.teamAId ?? match.teamA?.id) : (match.teamBId ?? match.teamB?.id)
  return match.winnerId != null && match.winnerId === teamId
}

function winnerClass(match: any, side: 'A' | 'B'): string {
  if (isWinner(match, side)) return 'text-green-700'
  if (match.isDraw) return 'text-amber-700'
  if (match.winnerId != null) return 'text-muted-foreground'
  return ''
}

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
  if (!sessionId.value) return
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

onMounted(async () => {
  try {
    const sessions = await getSessions()
    const active = (sessions as any[])
      .filter((s: any) => s.status !== 'FINISHED')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!active) return
    sessionId.value = active.id
    session.value = active

    await fetchAll()

    if (!currentMatch.value && finishedMatches.value.length > 0) {
      await fetchNextMatch()
    }
  } catch (e) {
    console.error('Erro ao inicializar:', e)
    showError('Erro ao carregar dados da sessão. Verifique sua conexão e tente novamente.')
  }
})

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
  if (match) {
    startTimer()
    startPolling()
  } else {
    stopTimer()
    stopPolling()
  }
}, { immediate: true })

onUnmounted(() => {
  stopPolling()
  stopTimer()
})

async function handleStartMatch() {
  if (!sessionId.value || !selectedTeamA.value || !selectedTeamB.value) return
  loading.value = true
  errorMessage.value = null
  try {
    await startMatch(sessionId.value, {
      teamAId: selectedTeamA.value,
      teamBId: selectedTeamB.value,
    })
    selectedTeamA.value = null
    selectedTeamB.value = null
    nextMatchSuggestion.value = null
    await fetchAll()
  } catch (e) {
    console.error('Erro ao iniciar partida:', e)
    showError('Erro ao iniciar partida: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function handleStartSuggestedMatch() {
  if (!sessionId.value || !nextMatchSuggestion.value) return
  loading.value = true
  errorMessage.value = null
  try {
    await startMatch(sessionId.value, {
      teamAId: nextMatchSuggestion.value.teamA?.id ?? nextMatchSuggestion.value.teamAId,
      teamBId: nextMatchSuggestion.value.teamB?.id ?? nextMatchSuggestion.value.teamBId,
    })
    nextMatchSuggestion.value = null
    await fetchAll()
  } catch (e) {
    console.error('Erro ao iniciar partida sugerida:', e)
    showError('Erro ao iniciar partida: ' + extractErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function handleGoal(playerId: number, teamId: number) {
  if (!currentMatch.value) return
  const minute = currentMinute.value
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

function handleEndMatchClick() {
  if (!currentMatch.value) return
  const isFirst = finishedMatches.value.length === 0
  const isDraw =
    (currentMatch.value.scoreA ?? 0) === (currentMatch.value.scoreB ?? 0)

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
    if (!currentMatch.value) {
      await fetchNextMatch()
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

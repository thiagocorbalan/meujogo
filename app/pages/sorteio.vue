<template>
  <div class="max-w-[960px] mx-auto py-8 px-4">
    <h1 class="text-3xl font-bold text-foreground mb-6">Sorteio de Times</h1>

    <p v-if="pageLoading" class="text-muted-foreground text-sm py-5">Carregando...</p>

    <div v-else-if="!sessionId" class="p-8 text-center bg-muted rounded-lg text-muted-foreground">
      <p>Nenhuma sessão ativa. Crie ou inicie uma sessão antes de realizar o sorteio.</p>
    </div>

    <template v-else-if="sessionId">
      <!-- Error message -->
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

      <!-- Draw controls -->
      <div class="flex flex-wrap items-center gap-4 bg-white border rounded-lg p-5 mb-6">
        <fieldset class="border-none p-0 m-0 flex items-center gap-4">
          <legend class="text-sm font-semibold text-foreground mr-2 float-left">Modo de sorteio</legend>
          <label class="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
            <input v-model="mode" type="radio" value="ALEATORIO" class="accent-primary" />
            Aleatório
          </label>
          <label class="flex items-center gap-1.5 text-sm text-foreground cursor-pointer">
            <input v-model="mode" type="radio" value="EQUILIBRADO" class="accent-primary" />
            Equilibrado (ELO)
          </label>
        </fieldset>

        <BaseButton
          variant="primary"
          size="md"
          :loading="loading"
          :disabled="loading || sessionInProgress"
          @click="handleDraw"
        >
          Sortear Times
        </BaseButton>

        <p v-if="sessionInProgress" class="text-sm text-muted-foreground">
          Sorteio bloqueado: partida em andamento.
        </p>
      </div>

      <p class="text-xs text-muted-foreground mb-6">
        Apenas jogadores de linha confirmados participam do sorteio. Goleiros são excluídos automaticamente.
      </p>

      <!-- Results -->
      <div v-if="teams.length > 0" class="mt-2">
        <h2 class="text-xl font-semibold text-foreground mb-4">Times sorteados</h2>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4 mb-6">
          <TeamsTeamCard v-for="team in teams" :key="team.id" :team="team" />
        </div>

        <div class="flex gap-3">
          <NuxtLink to="/partida">
            <BaseButton variant="secondary" size="md">Ir para Partida ao Vivo</BaseButton>
          </NuxtLink>
        </div>
      </div>

      <p v-else-if="!loading" class="text-sm text-muted-foreground">Nenhum time sorteado ainda.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
const { getSessions } = useSessions()
const { getSettings } = useSettings()
const { getTeams, drawTeams } = useTeams()

const teams = ref<any[]>([])
const mode = ref('ALEATORIO')
const loading = ref(false)
const pageLoading = ref(true)
const sessionId = ref<number | null>(null)
const sessionInProgress = ref(false)
const errorMessage = ref('')

const ERROR_MESSAGES: Record<number, string> = {
  403: 'Não é possível sortear: existe uma partida em andamento nesta sessão.',
  404: 'Sessão não encontrada. Verifique se a sessão ainda está ativa.',
}

function extractErrorMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object') {
    const err = e as any
    const status = err.statusCode ?? err.status ?? err.response?.status
    if (status && ERROR_MESSAGES[status]) {
      return ERROR_MESSAGES[status]
    }
    const serverMessage = err.data?.message ?? err.message
    if (typeof serverMessage === 'string' && serverMessage.length > 0) {
      return serverMessage
    }
  }
  return fallback
}

function normalizeTeams(raw: any[]): any[] {
  return raw.map((t) => ({
    ...t,
    players: (t.players ?? []).map((tp: any) => tp.player ?? tp),
    avgElo: t.avgElo ?? calcAvgElo((t.players ?? []).map((tp: any) => tp.player ?? tp)),
  }))
}

function calcAvgElo(players: any[]): number {
  if (!players.length) return 0
  return players.reduce((sum: number, p: any) => sum + (p.elo ?? 0), 0) / players.length
}

onMounted(async () => {
  try {
    const [sessions, settings] = await Promise.all([getSessions(), getSettings()])

    const active = (sessions as any[])
      .filter((s: any) => s.status !== 'FINISHED')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

    if (!active) return

    sessionId.value = active.id
    sessionInProgress.value = active.status === 'IN_PROGRESS'

    if (settings && (settings as any).drawMode) {
      mode.value = (settings as any).drawMode
    }

    const existingTeams = await getTeams(active.id)
    if (Array.isArray(existingTeams)) {
      teams.value = normalizeTeams(existingTeams)
    }
  } catch (e) {
    console.error('Erro ao carregar dados:', e)
    errorMessage.value = extractErrorMessage(e, 'Erro ao carregar dados da sessão. Tente recarregar a página.')
  } finally {
    pageLoading.value = false
  }
})

async function handleDraw() {
  if (!sessionId.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    await drawTeams(sessionId.value, mode.value)
    const refreshed = await getTeams(sessionId.value)
    if (Array.isArray(refreshed)) {
      teams.value = normalizeTeams(refreshed)
    }
  } catch (e) {
    console.error('Erro ao sortear times:', e)
    errorMessage.value = extractErrorMessage(e, 'Erro ao realizar o sorteio. Tente novamente.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-5">Estatísticas</h1>
<div v-if="errorMessage" class="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
      <span>{{ errorMessage }}</span>
      <button class="ml-3 text-red-600 hover:text-red-800 font-bold" @click="errorMessage = null">&times;</button>
    </div>

    <div v-if="initialLoading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <template v-else>
      <Tabs v-model="tab" class="mb-5">
        <TabsList>
          <TabsTrigger value="sessao">Sessao</TabsTrigger>
          <TabsTrigger value="temporada">Temporada</TabsTrigger>
          <TabsTrigger value="artilheiros">Artilheiros</TabsTrigger>
          <TabsTrigger value="elo">Melhor ELO</TabsTrigger>
        </TabsList>

        <TabsContent value="sessao">
          <div v-if="sessions.length" class="flex items-center gap-3 mb-4">
            <label class="text-sm font-semibold text-foreground">Sessao:</label>
            <select v-model="selectedSessionId" class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[280px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" @change="loadSessionRanking">
              <option v-for="s in sessions" :key="s.id" :value="s.id">
                #{{ s.id }} — {{ formatDate(s.createdAt) }} ({{ s.status }})
              </option>
            </select>
          </div>
          <div v-else class="text-muted-foreground text-sm py-5">Nenhuma sessao disponivel.</div>
          <RankingTable v-if="sessions.length" :ranking="sessionRanking" :loading="loading" />
        </TabsContent>

        <TabsContent value="temporada">
          <div v-if="seasons.length" class="flex items-center gap-3 mb-4">
            <label class="text-sm font-semibold text-foreground">Temporada:</label>
            <select v-model="selectedSeasonId" class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[280px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" @change="loadSeasonRanking">
              <option v-for="s in seasons" :key="s.id" :value="s.id">
                {{ s.name ?? `Temporada ${s.year}` }} ({{ s.isClosed ? 'Encerrada' : 'Ativa' }})
              </option>
            </select>
          </div>
          <div v-else class="text-muted-foreground text-sm py-5">Nenhuma temporada disponivel.</div>
          <RankingTable v-if="seasons.length" :ranking="seasonRanking" :loading="loading" />
        </TabsContent>

        <TabsContent value="artilheiros">
          <div v-if="seasons.length" class="flex items-center gap-3 mb-4">
            <label class="text-sm font-semibold text-foreground">Temporada:</label>
            <select v-model="scorersSeasonId" class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[280px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" @change="loadTopScorers">
              <option :value="null">Todas</option>
              <option v-for="s in seasons" :key="s.id" :value="s.id">
                {{ s.name ?? `Temporada ${s.year}` }}
              </option>
            </select>
          </div>
          <RankingTopScorersTable :players="topScorers" :loading="loading" />
        </TabsContent>

        <TabsContent value="elo">
          <div v-if="seasons.length" class="flex items-center gap-3 mb-4">
            <label class="text-sm font-semibold text-foreground">Temporada:</label>
            <select v-model="eloSeasonId" class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm min-w-[280px] ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" @change="loadTopElo">
              <option :value="null">Todas</option>
              <option v-for="s in seasons" :key="s.id" :value="s.id">
                {{ s.name ?? `Temporada ${s.year}` }}
              </option>
            </select>
          </div>
          <RankingTopEloTable :players="topElo" :loading="loading" />
        </TabsContent>
      </Tabs>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const { getSessions } = useSessions()
const { getSeasons } = useSeasons()
const { getSessionRanking, getSeasonRanking } = useRanking()
const { getTopScorers, getTopElo } = useStats()

const tab = ref('sessao')
const loading = ref(false)
const initialLoading = ref(true)
const sessions = ref<any[]>([])
const seasons = ref<any[]>([])
const selectedSessionId = ref<number | null>(null)
const selectedSeasonId = ref<number | null>(null)
const sessionRanking = ref<any[]>([])
const seasonRanking = ref<any[]>([])
const topScorers = ref<any[]>([])
const topElo = ref<any[]>([])
const scorersSeasonId = ref<number | null>(null)
const eloSeasonId = ref<number | null>(null)
const errorMessage = ref<string | null>(null)

function showError(message: string) {
  errorMessage.value = message
  setTimeout(() => {
    if (errorMessage.value === message) errorMessage.value = null
  }, 8000)
}

onMounted(async () => {
  try {
    const [sessionsData, seasonsData] = await Promise.all([getSessions(), getSeasons()])
    sessions.value = (sessionsData as any[]).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    seasons.value = seasonsData as any[]

    if (sessions.value.length) {
      selectedSessionId.value = sessions.value[0].id
      await loadSessionRanking()
    }
    if (seasons.value.length) {
      selectedSeasonId.value = seasons.value[0].id
    }
  } catch (e) {
    console.error('Erro ao carregar dados:', e)
    showError('Erro ao carregar dados. Verifique sua conexão e tente novamente.')
  } finally {
    initialLoading.value = false
  }
})

async function loadSessionRanking() {
  if (!selectedSessionId.value) return
  loading.value = true
  errorMessage.value = null
  try {
    const data = await getSessionRanking(selectedSessionId.value)
    sessionRanking.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erro ao carregar ranking da sessão:', e)
    showError('Erro ao carregar ranking da sessão.')
    sessionRanking.value = []
  } finally {
    loading.value = false
  }
}

async function loadSeasonRanking() {
  if (!selectedSeasonId.value) return
  loading.value = true
  errorMessage.value = null
  try {
    const data = await getSeasonRanking(selectedSeasonId.value)
    seasonRanking.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erro ao carregar ranking da temporada:', e)
    showError('Erro ao carregar ranking da temporada.')
    seasonRanking.value = []
  } finally {
    loading.value = false
  }
}

async function loadTopScorers() {
  loading.value = true
  errorMessage.value = null
  try {
    const params: any = { limit: 20 }
    if (scorersSeasonId.value) params.seasonId = scorersSeasonId.value
    const data = await getTopScorers(params)
    topScorers.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erro ao carregar artilheiros:', e)
    showError('Erro ao carregar artilheiros.')
    topScorers.value = []
  } finally {
    loading.value = false
  }
}

async function loadTopElo() {
  loading.value = true
  errorMessage.value = null
  try {
    const params: any = { limit: 20 }
    if (eloSeasonId.value) params.seasonId = eloSeasonId.value
    const data = await getTopElo(params)
    topElo.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erro ao carregar ranking ELO:', e)
    showError('Erro ao carregar ranking ELO.')
    topElo.value = []
  } finally {
    loading.value = false
  }
}

watch(tab, (newTab) => {
  if (newTab === 'sessao' && selectedSessionId.value) loadSessionRanking()
  if (newTab === 'temporada' && selectedSeasonId.value) loadSeasonRanking()
  if (newTab === 'artilheiros') loadTopScorers()
  if (newTab === 'elo') loadTopElo()
})

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}
</script>

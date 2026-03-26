<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
      <BaseButton variant="primary" @click="openNewSession">Nova Sessao</BaseButton>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <div v-else-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-6">
      <p class="font-semibold mb-1">Erro ao carregar dashboard</p>
      <p>{{ error }}</p>
      <BaseButton variant="secondary" size="sm" class="mt-3" @click="loadDashboard">Tentar novamente</BaseButton>
    </div>

    <template v-else>
      <div class="grid grid-cols-3 max-md:grid-cols-2 gap-4 mb-8">
        <DashboardStatsCard title="Sessão Atual" :value="data?.currentSession?.status ?? '—'" color="#6366f1" />
        <DashboardStatsCard title="Jogadores Ativos" :value="data?.activePlayersCount ?? 0" color="#3b82f6" />
        <DashboardStatsCard title="Confirmados" :value="data?.confirmedCount ?? 0" color="#22c55e" />
        <DashboardStatsCard title="Times" :value="data?.teamsCount ?? 0" color="#f59e0b" />
        <DashboardStatsCard
          title="Artilheiro"
          :value="data?.topScorer ? `${data.topScorer.name} (${data.topScorer.goals} gols)` : '—'"
          color="#ef4444"
        />
        <DashboardStatsCard
          title="Maior ELO"
          :value="data?.highestElo ? `${data.highestElo.name} (${data.highestElo.elo})` : '—'"
          color="#8b5cf6"
        />
      </div>

      <div class="mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-4">Fluxo da Sessão</h2>
        <DashboardFlowStepper />
      </div>

      <div class="mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-4">Sessões Recentes</h2>
        <div v-if="data?.recentSessions?.length" class="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Partidas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="session in data.recentSessions" :key="session.id">
                <TableCell>{{ formatDate(session.createdAt) }}</TableCell>
                <TableCell>{{ session.status }}</TableCell>
                <TableCell>{{ session._count?.matches ?? 0 }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <p v-else class="text-muted-foreground text-sm">Nenhuma sessão encontrada.</p>
      </div>
    </template>

    <!-- New Session Modal -->
    <BaseModal :show="showNewSession" title="Nova Sessao" @close="showNewSession = false">
      <form class="flex flex-col gap-4" @submit.prevent="handleCreateSession">
        <div class="flex flex-col gap-1">
          <label class="text-sm font-semibold text-foreground">Temporada</label>
          <select v-model="sessionForm.seasonId" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option :value="null" disabled>Selecione...</option>
            <option v-for="s in seasons" :key="s.id" :value="s.id">
              {{ s.name ?? `Temporada ${s.year}` }} {{ s.isClosed ? '(Encerrada)' : '' }}
            </option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-foreground">Duracao da Sessao (min)</label>
            <input v-model.number="sessionForm.durationMinutes" type="number" min="1" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-foreground">Duracao da Partida (min)</label>
            <input v-model.number="sessionForm.matchDurationMinutes" type="number" min="1" required class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />
          </div>
        </div>
        <p v-if="sessionForm.durationMinutes && sessionForm.matchDurationMinutes" class="text-xs text-muted-foreground">
          Total de partidas: {{ Math.floor(sessionForm.durationMinutes / sessionForm.matchDurationMinutes) }}
        </p>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="showNewSession = false">Cancelar</BaseButton>
        <BaseButton variant="primary" :loading="creatingSession" :disabled="!sessionForm.seasonId" @click="handleCreateSession">Criar Sessao</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const { getDashboard } = useDashboard()
const { createSession } = useSessions()
const { getSeasons } = useSeasons()
const { getSettings } = useSettings()

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<any>(null)
const showNewSession = ref(false)
const creatingSession = ref(false)
const seasons = ref<any[]>([])
const sessionForm = ref({
  seasonId: null as number | null,
  durationMinutes: 120,
  matchDurationMinutes: 10,
})

async function loadDashboard() {
  loading.value = true
  error.value = null
  try {
    data.value = await getDashboard()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Nao foi possivel carregar os dados do dashboard.'
  } finally {
    loading.value = false
  }
}

async function openNewSession() {
  showNewSession.value = true
  if (seasons.value.length === 0) {
    try {
      const [seasonsData, settings] = await Promise.all([getSeasons(), getSettings()])
      seasons.value = (seasonsData as any[]).filter((s: any) => !s.isClosed)
      if (seasons.value.length) sessionForm.value.seasonId = seasons.value[0].id
      if (settings) {
        sessionForm.value.durationMinutes = (settings as any).sessionDurationMin ?? 120
        sessionForm.value.matchDurationMinutes = (settings as any).matchDurationMin ?? 10
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e)
    }
  }
}

async function handleCreateSession() {
  if (!sessionForm.value.seasonId) return
  creatingSession.value = true
  error.value = null
  try {
    await createSession({
      seasonId: sessionForm.value.seasonId,
      durationMinutes: sessionForm.value.durationMinutes,
      matchDurationMinutes: sessionForm.value.matchDurationMinutes,
    })
    showNewSession.value = false
    await loadDashboard()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao criar sessao.'
  } finally {
    creatingSession.value = false
  }
}

onMounted(() => loadDashboard())

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
        <p v-if="activeGroupName" class="text-sm text-muted-foreground mt-1">{{ activeGroupName }}</p>
      </div>
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

  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const groupsStore = useGroupsStore()
const activeGroupName = computed(() => {
  const ag = groupsStore.activeGroup
  return ag?.group?.name ?? ag?.name ?? ''
})

const { getDashboard } = useDashboard()

const loading = ref(true)
const error = ref<string | null>(null)
const data = ref<any>(null)

async function loadDashboard() {
  loading.value = true
  error.value = null
  try {
    data.value = await getDashboard()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Não foi possível carregar os dados do dashboard.'
  } finally {
    loading.value = false
  }
}

onMounted(() => loadDashboard())

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}
</script>

<script setup lang="ts">
import { Users, FolderOpen, UserRound, ShieldCheck, Calendar, CalendarDays, TrendingUp, DollarSign, RefreshCw, AlertCircle } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

definePageMeta({ layout: 'admin' })

type Period = 'day' | 'week' | 'month'

interface StatsData {
  totalUsers: number
  activeGroups: number
  totalLinhaPlayers: number
  totalGoalkeepers: number
  sessionsToday: number
  sessionsThisWeek: number
  newUsersChart: Array<{ date: string; count: number }>
  topActiveGroups: Array<{ groupId: number; groupName: string; ownerEmail: string | null; sessionCount: number }>
  matchHeatmap: Array<{ day: string; count: number }>
}

interface StripeData {
  stripeConfigured: boolean
  mrr?: number | null
  subscribers?: number | null
  churnRate?: number | null
  trials?: number | null
}

const adminApi = useAdminApi()

const loading = ref(true)
const error = ref<string | null>(null)
const stats = ref<StatsData | null>(null)
const stripe = ref<StripeData | null>(null)
const period = ref<Period>('week')

const DOW_LABELS: Record<string, string> = {
  Sun: 'Dom',
  Mon: 'Seg',
  Tue: 'Ter',
  Wed: 'Qua',
  Thu: 'Qui',
  Fri: 'Sex',
  Sat: 'Sáb',
}

// Order Mon-Sun for display
const heatmapOrdered = computed(() => {
  if (!stats.value?.matchHeatmap) return []
  const order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return order.map((key) => {
    const found = stats.value!.matchHeatmap.find((d) => d.day === key)
    return { day: key, label: DOW_LABELS[key] ?? key, count: found?.count ?? 0 }
  })
})

const heatmapMax = computed(() => {
  const counts = heatmapOrdered.value.map((d) => d.count)
  return Math.max(1, ...counts)
})

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [statsResult, stripeResult] = await Promise.all([
      adminApi.getStats(period.value),
      adminApi.getStripeStats(),
    ])
    stats.value = statsResult
    stripe.value = stripeResult
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Não foi possível carregar os dados.'
  } finally {
    loading.value = false
  }
}

async function onPeriodChange(newPeriod: Period) {
  period.value = newPeriod
  await loadData()
}

function formatCurrency(val: number | null | undefined) {
  if (val == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}

function formatPercent(val: number | null | undefined) {
  if (val == null) return '—'
  return `${val.toFixed(1)}%`
}

onMounted(() => loadData())
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Dashboard Admin</h1>
        <p class="text-sm text-muted-foreground mt-0.5">Visão geral da plataforma</p>
      </div>
      <BaseButton variant="secondary" size="sm" :loading="loading" @click="loadData">
        <RefreshCw class="w-3.5 h-3.5 mr-1.5" aria-hidden="true" />
        Atualizar
      </BaseButton>
    </div>

    <!-- Loading state -->
    <div v-if="loading && !stats" class="text-muted-foreground text-sm py-16 text-center">
      Carregando...
    </div>

    <!-- Error state -->
    <div
      v-else-if="error"
      class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-6"
      role="alert"
    >
      <div class="flex items-center gap-2 font-semibold mb-1">
        <AlertCircle class="w-4 h-4" aria-hidden="true" />
        Erro ao carregar dados
      </div>
      <p>{{ error }}</p>
      <BaseButton variant="secondary" size="sm" class="mt-3" @click="loadData">Tentar novamente</BaseButton>
    </div>

    <template v-else-if="stats">
      <!-- Period selector -->
      <div class="flex items-center gap-2 mb-6">
        <label for="period-select" class="text-sm font-medium text-foreground">Período:</label>
        <select
          id="period-select"
          :value="period"
          class="text-sm border rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          @change="onPeriodChange(($event.target as HTMLSelectElement).value as Period)"
        >
          <option value="day">Dia</option>
          <option value="week">Semana</option>
          <option value="month">Mês</option>
        </select>
      </div>

      <!-- Main stat cards -->
      <section aria-label="Estatísticas principais" class="mb-6">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminStatCard
            label="Total Usuários"
            :value="stats.totalUsers"
            :icon="Users"
          />
          <AdminStatCard
            label="Grupos Ativos"
            :value="stats.activeGroups"
            subtitle="últimos 30 dias"
            :icon="FolderOpen"
          />
          <AdminStatCard
            label="Jogadores"
            :value="stats.totalLinhaPlayers"
            subtitle="posição LINHA"
            :icon="UserRound"
          />
          <AdminStatCard
            label="Goleiros"
            :value="stats.totalGoalkeepers"
            subtitle="posição GOLEIRO"
            :icon="ShieldCheck"
          />
        </div>
      </section>

      <!-- Sessions cards -->
      <section aria-label="Sessões" class="mb-6">
        <div class="grid grid-cols-2 gap-4">
          <AdminStatCard
            label="Sessões Hoje"
            :value="stats.sessionsToday"
            :icon="Calendar"
          />
          <AdminStatCard
            label="Sessões Esta Semana"
            :value="stats.sessionsThisWeek"
            :icon="CalendarDays"
          />
        </div>
      </section>

      <!-- New users chart -->
      <section aria-label="Novos usuários" class="mb-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base font-semibold">Novos Usuários</CardTitle>
            <p class="text-xs text-muted-foreground mt-0.5">
              {{ period === 'day' ? 'Últimas 24h' : period === 'week' ? 'Últimos 7 dias' : 'Últimos 30 dias' }}
            </p>
          </CardHeader>
          <CardContent>
            <AdminChart :data="stats.newUsersChart" label="Novos usuários" />
          </CardContent>
        </Card>
      </section>

      <!-- Match heatmap -->
      <section aria-label="Heatmap de partidas por dia da semana" class="mb-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base font-semibold">Partidas por Dia da Semana</CardTitle>
            <p class="text-xs text-muted-foreground mt-0.5">Últimos 90 dias</p>
          </CardHeader>
          <CardContent>
            <div class="flex items-end gap-2" role="img" :aria-label="`Distribuição de partidas por dia da semana`">
              <div
                v-for="item in heatmapOrdered"
                :key="item.day"
                class="flex flex-col items-center gap-1 flex-1"
                :aria-label="`${item.label}: ${item.count} partida${item.count !== 1 ? 's' : ''}`"
              >
                <span class="text-xs text-muted-foreground font-medium">{{ item.count }}</span>
                <div
                  class="w-full rounded transition-all"
                  :style="{
                    height: `${Math.max(4, (item.count / heatmapMax) * 80)}px`,
                    backgroundColor: `rgba(99, 102, 241, ${Math.max(0.1, item.count / heatmapMax)})`,
                  }"
                />
                <span class="text-xs text-muted-foreground">{{ item.label }}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <!-- Top 10 active groups -->
      <section aria-label="Grupos mais ativos" class="mb-6">
        <Card>
          <CardHeader class="pb-3">
            <CardTitle class="text-base font-semibold">Top 10 Grupos Mais Ativos</CardTitle>
            <p class="text-xs text-muted-foreground mt-0.5">Sessões nos últimos 30 dias</p>
          </CardHeader>
          <CardContent class="p-0">
            <div v-if="stats.topActiveGroups.length" class="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">#</TableHead>
                    <TableHead scope="col">Grupo</TableHead>
                    <TableHead scope="col">Dono</TableHead>
                    <TableHead scope="col" class="text-right">Sessões</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="(group, idx) in stats.topActiveGroups" :key="group.groupId">
                    <TableCell class="text-muted-foreground text-sm w-8">{{ idx + 1 }}</TableCell>
                    <TableCell class="font-medium">{{ group.groupName }}</TableCell>
                    <TableCell class="text-muted-foreground text-sm">{{ group.ownerEmail ?? '—' }}</TableCell>
                    <TableCell class="text-right font-semibold">{{ group.sessionCount }}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p v-else class="text-sm text-muted-foreground px-6 py-4">Nenhum grupo com sessões recentes.</p>
          </CardContent>
        </Card>
      </section>

      <!-- Stripe panel -->
      <section aria-label="Integração Stripe" class="mb-6">
        <template v-if="stripe">
          <!-- Stripe not configured -->
          <div
            v-if="!stripe.stripeConfigured"
            class="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700 p-4 flex items-start gap-3"
            role="status"
          >
            <AlertCircle class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p class="font-semibold text-amber-900 dark:text-amber-300 text-sm">Stripe não configurado</p>
              <p class="text-amber-700 dark:text-amber-400 text-sm mt-0.5">
                Configure sua integração com o Stripe para visualizar métricas de receita.
              </p>
              <NuxtLink
                to="/admin/integrations"
                class="inline-block mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 underline underline-offset-2 hover:text-amber-900"
              >
                Configurar integrações
              </NuxtLink>
            </div>
          </div>

          <!-- Stripe configured -->
          <template v-else>
            <h2 class="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp class="w-4 h-4" aria-hidden="true" />
              Métricas Stripe
            </h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AdminStatCard
                label="MRR"
                :value="formatCurrency(stripe.mrr)"
                :icon="DollarSign"
              />
              <AdminStatCard
                label="Assinantes"
                :value="stripe.subscribers ?? '—'"
              />
              <AdminStatCard
                label="Churn"
                :value="formatPercent(stripe.churnRate)"
              />
              <AdminStatCard
                label="Trials Ativos"
                :value="stripe.trials ?? '—'"
              />
            </div>
          </template>
        </template>
      </section>
    </template>
  </div>
</template>

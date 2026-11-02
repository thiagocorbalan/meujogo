<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableEmpty,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  Users,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const { getBillingOverview, getStripeStats } = useAdminApi()

const loading = ref(true)
const error = ref<string | null>(null)
const stripeConfigured = ref(true)
const overview = ref<any>(null)
const stripeStats = ref<any>(null)

async function fetchData() {
  loading.value = true
  error.value = null
  try {
    const [stripeData, billingData] = await Promise.all([
      getStripeStats().catch(() => ({ stripeConfigured: false })),
      getBillingOverview().catch(() => null),
    ])

    if (stripeData?.stripeConfigured === false) {
      stripeConfigured.value = false
    } else {
      stripeConfigured.value = true
      stripeStats.value = stripeData
    }

    overview.value = billingData
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar dados de billing.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)

// ── Computed helpers ─────────────────────────────────────────────────────────

const planDistribution = computed<any[]>(() => overview.value?.planDistribution ?? [])
const activeTrials = computed<any[]>(() => overview.value?.activeTrials ?? [])
const recentPayments = computed<any[]>(() => overview.value?.recentPayments ?? [])
const failedPayments = computed<any[]>(() =>
  recentPayments.value.filter((p: any) => p.status === 'failed' || p.status === 'FAILED'),
)

const totalDistribution = computed(() =>
  planDistribution.value.reduce((acc: number, p: any) => acc + (p.count ?? 0), 0),
)

function distributionPercent(count: number): string {
  if (!totalDistribution.value) return '0%'
  return ((count / totalDistribution.value) * 100).toFixed(1) + '%'
}

function formatCurrency(value: any): string {
  const n = Number(value)
  if (isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(value: any): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('pt-BR')
}

function paymentStatusLabel(status: string): string {
  const map: Record<string, string> = {
    succeeded: 'Pago',
    SUCCEEDED: 'Pago',
    pending: 'Pendente',
    PENDING: 'Pendente',
    failed: 'Falhou',
    FAILED: 'Falhou',
    refunded: 'Estornado',
    REFUNDED: 'Estornado',
  }
  return map[status] ?? status
}

function isFailedPayment(payment: any): boolean {
  return payment.status === 'failed' || payment.status === 'FAILED'
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-foreground">Billing</h1>
      <p class="text-sm text-muted-foreground mt-1">Visão geral de assinaturas e pagamentos.</p>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6"
    >
      {{ error }}
    </div>

    <!-- Stripe not configured banner -->
    <div
      v-if="!stripeConfigured && !loading"
      role="alert"
      class="flex items-center gap-3 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-6"
    >
      <AlertTriangle class="w-4 h-4 shrink-0 text-amber-500" aria-hidden="true" />
      <span>
        Integração Stripe não configurada.
        <NuxtLink to="/admin/integrations" class="underline font-medium hover:no-underline ml-1">
          Configurar agora
        </NuxtLink>
      </span>
    </div>

    <div v-if="loading" class="text-center py-12 text-muted-foreground">Carregando...</div>

    <template v-else>
      <!-- Stripe metrics cards -->
      <div v-if="stripeConfigured && stripeStats" class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 mb-8">
        <AdminStatCard
          label="MRR"
          :value="formatCurrency(stripeStats.mrr ?? 0)"
          :icon="DollarSign"
        />
        <AdminStatCard
          label="Assinantes Ativos"
          :value="stripeStats.activeSubscribers ?? 0"
          :icon="Users"
        />
        <AdminStatCard
          label="Churn (mês)"
          :value="stripeStats.churnThisMonth ?? 0"
          :icon="TrendingDown"
        />
        <AdminStatCard
          label="Trials Ativos"
          :value="stripeStats.activeTrials ?? 0"
          :icon="Clock"
        />
      </div>

      <!-- Plan distribution -->
      <section aria-label="Distribuição por plano" class="mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-4">Distribuição por Plano</h2>
        <div
          v-if="planDistribution.length"
          class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4"
        >
          <Card
            v-for="plan in planDistribution"
            :key="plan.planId ?? plan.name"
            role="region"
            :aria-label="`Plano ${plan.planName ?? plan.name}: ${plan.count} grupos`"
            class="bg-card"
          >
            <CardHeader class="pb-1 pt-4 px-4">
              <CardTitle class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {{ plan.planName ?? plan.name }}
              </CardTitle>
            </CardHeader>
            <CardContent class="px-4 pb-4">
              <p class="text-3xl font-bold text-foreground leading-none">{{ plan.count }}</p>
              <p class="text-xs text-muted-foreground mt-1">
                {{ distributionPercent(plan.count) }} do total
              </p>
            </CardContent>
          </Card>
        </div>
        <p v-else class="text-sm text-muted-foreground">Nenhum dado de distribuição disponível.</p>
      </section>

      <!-- Active trials -->
      <section aria-label="Trials ativos" class="mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-4">Trials Ativos</h2>
        <Card>
          <CardContent class="p-0">
            <Table aria-label="Trials ativos">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Grupo</TableHead>
                  <TableHead scope="col">Plano</TableHead>
                  <TableHead scope="col">Dias Restantes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="!activeTrials.length" colspan="3">Nenhum trial ativo.</TableEmpty>
                <TableRow v-for="trial in activeTrials" :key="trial.groupId ?? trial.id">
                  <TableCell class="font-medium">{{ trial.groupName ?? trial.name }}</TableCell>
                  <TableCell>{{ trial.planName }}</TableCell>
                  <TableCell>
                    <span
                      :class="[
                        'inline-flex items-center gap-1.5 text-sm font-medium',
                        trial.daysRemaining <= 3 ? 'text-amber-600' : 'text-foreground',
                      ]"
                    >
                      <Clock class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {{ trial.daysRemaining }} dia{{ trial.daysRemaining !== 1 ? 's' : '' }}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <!-- Failed payments alert -->
      <section v-if="failedPayments.length" aria-label="Pagamentos com falha" class="mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-4">
          <span class="inline-flex items-center gap-2">
            <AlertTriangle class="w-5 h-5 text-destructive" aria-hidden="true" />
            Pagamentos com Falha
          </span>
        </h2>
        <div class="space-y-2">
          <div
            v-for="payment in failedPayments"
            :key="payment.id"
            role="alert"
            class="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
          >
            <XCircle class="w-4 h-4 shrink-0 text-destructive mt-0.5" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-foreground">{{ payment.groupName }}</p>
              <p class="text-muted-foreground text-xs mt-0.5">
                {{ formatDate(payment.date ?? payment.createdAt) }} · {{ formatCurrency(payment.amount) }}
                <span v-if="payment.failureReason" class="ml-1">— {{ payment.failureReason }}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent payments table -->
      <section aria-label="Pagamentos recentes">
        <h2 class="text-lg font-semibold text-foreground mb-4">Pagamentos Recentes</h2>
        <Card>
          <CardContent class="p-0">
            <Table aria-label="Pagamentos recentes">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Data</TableHead>
                  <TableHead scope="col">Grupo</TableHead>
                  <TableHead scope="col">Valor</TableHead>
                  <TableHead scope="col">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableEmpty v-if="!recentPayments.length" colspan="4">Nenhum pagamento registrado.</TableEmpty>
                <TableRow
                  v-for="payment in recentPayments"
                  :key="payment.id"
                  :class="isFailedPayment(payment) ? 'bg-destructive/5' : ''"
                >
                  <TableCell>{{ formatDate(payment.date ?? payment.createdAt) }}</TableCell>
                  <TableCell class="font-medium">{{ payment.groupName }}</TableCell>
                  <TableCell>{{ formatCurrency(payment.amount) }}</TableCell>
                  <TableCell>
                    <span
                      v-if="!isFailedPayment(payment)"
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium text-green-600 bg-green-50 border-green-200"
                    >
                      <CheckCircle2 class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {{ paymentStatusLabel(payment.status) }}
                    </span>
                    <span
                      v-else
                      role="alert"
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium text-red-600 bg-red-50 border-red-200"
                    >
                      <XCircle class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      {{ paymentStatusLabel(payment.status) }}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </template>
  </div>
</template>

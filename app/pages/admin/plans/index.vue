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
import { CheckCircle2, XCircle, Users } from 'lucide-vue-next'
import type { PlanFormData } from '@/components/admin/PlanFormModal.vue'

definePageMeta({ layout: 'admin' })

const { getPlans, deletePlan, getStats } = useAdminApi()

const loading = ref(true)
const error = ref<string | null>(null)
const plans = ref<any[]>([])
const distribution = ref<Record<number, number>>({})

async function fetchPlans() {
  loading.value = true
  error.value = null
  try {
    const [plansData, statsData] = await Promise.all([
      getPlans(),
      getStats().catch(() => null),
    ])
    plans.value = Array.isArray(plansData) ? plansData : (plansData?.data ?? [])

    // Build distribution map from stats if available
    if (statsData?.planDistribution) {
      for (const entry of statsData.planDistribution) {
        distribution.value[entry.planId] = entry.count
      }
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar planos.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchPlans)

// ── Modal ────────────────────────────────────────────────────────────────────

const showModal = ref(false)
const editTarget = ref<Partial<PlanFormData> | undefined>(undefined)

function openCreate() {
  editTarget.value = undefined
  showModal.value = true
}

function openEdit(plan: any) {
  editTarget.value = {
    id: plan.id,
    name: plan.name,
    priceMonthly: plan.priceMonthly,
    priceAnnual: plan.priceAnnual,
    maxPlayers: plan.maxPlayers,
    maxSessionsPerMonth: plan.maxSessionsPerMonth,
    trialDays: plan.trialDays,
    trialExpireBehavior: plan.trialExpireBehavior,
    stripePriceIdMonthly: plan.stripePriceIdMonthly ?? '',
    stripePriceIdAnnual: plan.stripePriceIdAnnual ?? '',
    features: Array.isArray(plan.features) ? plan.features.join(', ') : (plan.features ?? ''),
  }
  showModal.value = true
}

function onModalSaved() {
  showModal.value = false
  fetchPlans()
}

// ── Deactivate ───────────────────────────────────────────────────────────────

const showDeactivateModal = ref(false)
const deactivateTarget = ref<any | null>(null)
const deactivating = ref(false)
const deactivateError = ref<string | null>(null)

function openDeactivate(plan: any) {
  deactivateTarget.value = plan
  deactivateError.value = null
  showDeactivateModal.value = true
}

function closeDeactivateModal() {
  showDeactivateModal.value = false
  deactivateTarget.value = null
  deactivateError.value = null
}

async function confirmDeactivate() {
  if (!deactivateTarget.value) return
  deactivating.value = true
  deactivateError.value = null
  try {
    await deletePlan(deactivateTarget.value.id)
    closeDeactivateModal()
    await fetchPlans()
  } catch (e: any) {
    deactivateError.value = e?.data?.message || e?.message || 'Erro ao desativar plano.'
  } finally {
    deactivating.value = false
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function subscriberCount(plan: any): number {
  return distribution.value[plan.id] ?? plan._count?.groups ?? 0
}

function formatPrice(value: any): string {
  const n = Number(value)
  if (isNaN(n)) return '—'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-foreground">Planos</h1>
        <p class="text-sm text-muted-foreground mt-1">Gerencie os planos de assinatura da plataforma.</p>
      </div>
      <BaseButton @click="openCreate">+ Criar Plano</BaseButton>
    </div>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive mb-6"
    >
      {{ error }}
    </div>

    <!-- Plans table -->
    <Card>
      <CardContent class="p-0">
        <div v-if="loading" class="text-center py-12 text-muted-foreground">Carregando...</div>
        <Table v-else aria-label="Lista de planos">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Nome</TableHead>
              <TableHead scope="col">Preço Mensal</TableHead>
              <TableHead scope="col">Preço Anual</TableHead>
              <TableHead scope="col">Máx. Jogadores</TableHead>
              <TableHead scope="col">Máx. Sessões/Mês</TableHead>
              <TableHead scope="col">Assinantes</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col" class="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableEmpty v-if="!plans.length" colspan="8">Nenhum plano cadastrado.</TableEmpty>
            <TableRow v-for="plan in plans" :key="plan.id">
              <TableCell class="font-medium">{{ plan.name }}</TableCell>
              <TableCell>{{ formatPrice(plan.priceMonthly) }}</TableCell>
              <TableCell>{{ formatPrice(plan.priceAnnual) }}</TableCell>
              <TableCell>{{ plan.maxPlayers }}</TableCell>
              <TableCell>{{ plan.maxSessionsPerMonth }}</TableCell>
              <TableCell>
                <span class="inline-flex items-center gap-1.5">
                  <Users class="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                  {{ subscriberCount(plan) }}
                </span>
              </TableCell>
              <TableCell>
                <span
                  v-if="plan.isActive"
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium text-green-600 bg-green-50 border-green-200"
                >
                  <CheckCircle2 class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Ativo
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium text-gray-500 bg-gray-50 border-gray-200"
                >
                  <XCircle class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  Inativo
                </span>
              </TableCell>
              <TableCell class="text-right">
                <div class="flex items-center justify-end gap-2">
                  <BaseButton size="sm" variant="secondary" @click="openEdit(plan)">
                    Editar
                  </BaseButton>
                  <BaseButton
                    v-if="plan.isActive"
                    size="sm"
                    variant="danger"
                    @click="openDeactivate(plan)"
                  >
                    Desativar
                  </BaseButton>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>

    <!-- Distribution cards -->
    <template v-if="plans.length > 0">
      <h2 class="text-lg font-semibold text-foreground mt-8 mb-4">Distribuição de Grupos por Plano</h2>
      <div class="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <Card
          v-for="plan in plans"
          :key="`dist-${plan.id}`"
          role="region"
          :aria-label="`Plano ${plan.name}: ${subscriberCount(plan)} grupos`"
          class="bg-card"
        >
          <CardHeader class="pb-1 pt-4 px-4">
            <CardTitle class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              {{ plan.name }}
            </CardTitle>
          </CardHeader>
          <CardContent class="px-4 pb-4">
            <p class="text-3xl font-bold text-foreground leading-none">{{ subscriberCount(plan) }}</p>
            <p class="text-xs text-muted-foreground mt-1">
              grupo{{ subscriberCount(plan) !== 1 ? 's' : '' }}
            </p>
          </CardContent>
        </Card>
      </div>
    </template>

    <!-- Plan form modal -->
    <AdminPlanFormModal
      :show="showModal"
      :initial="editTarget"
      @close="showModal = false"
      @saved="onModalSaved"
    />

    <!-- Deactivate confirmation modal -->
    <BaseModal
      :show="showDeactivateModal"
      title="Desativar Plano"
      @close="closeDeactivateModal"
    >
      <div class="text-sm text-muted-foreground">
        <template v-if="deactivateTarget && subscriberCount(deactivateTarget) > 0">
          <p class="mb-2 font-semibold text-amber-700">
            Este plano tem {{ subscriberCount(deactivateTarget) }} assinante{{ subscriberCount(deactivateTarget) !== 1 ? 's' : '' }} — confirme a migração antes de desativar.
          </p>
          <p>Todos os grupos neste plano precisam ser migrados para outro plano antes da desativação.</p>
        </template>
        <template v-else>
          <p>Tem certeza que deseja desativar o plano <strong>{{ deactivateTarget?.name }}</strong>?</p>
          <p class="mt-1 text-xs">O plano ficará invisível para novos assinantes.</p>
        </template>
      </div>
      <div
        v-if="deactivateError"
        role="alert"
        class="rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive mt-3"
      >
        {{ deactivateError }}
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeDeactivateModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="deactivating" @click="confirmDeactivate">
          Confirmar Desativação
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

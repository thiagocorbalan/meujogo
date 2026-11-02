<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ArrowLeft } from 'lucide-vue-next'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const adminApi = useAdminApi()

const groupId = route.params.id as string

// ── State ─────────────────────────────────────────────────────────────────────
const group = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Suspend modal
const showSuspendModal = ref(false)
const suspendReason = ref('')
const suspendLoading = ref(false)
const suspendError = ref<string | null>(null)

// Reactivate modal
const showReactivateModal = ref(false)
const reactivateLoading = ref(false)

// ── Data loading ──────────────────────────────────────────────────────────────
async function fetchGroup() {
  loading.value = true
  error.value = null
  try {
    group.value = await adminApi.getGroup(groupId)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar grupo.'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchGroup())

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupStatus(g: any): 'active' | 'inactive' | 'suspended' {
  if (g.suspended) return 'suspended'
  if (!g.lastSessionAt) return 'inactive'
  const diff = Date.now() - new Date(g.lastSessionAt).getTime()
  return diff > 30 * 24 * 60 * 60 * 1000 ? 'inactive' : 'active'
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

// ── Suspend ───────────────────────────────────────────────────────────────────
function openSuspend() {
  suspendReason.value = ''
  suspendError.value = null
  showSuspendModal.value = true
}

function closeSuspend() {
  showSuspendModal.value = false
  suspendReason.value = ''
  suspendError.value = null
}

async function confirmSuspend() {
  if (!suspendReason.value.trim()) {
    suspendError.value = 'O motivo é obrigatório.'
    return
  }
  suspendLoading.value = true
  suspendError.value = null
  try {
    await adminApi.suspendGroup(groupId, suspendReason.value.trim())
    group.value = { ...group.value, suspended: true }
    closeSuspend()
  } catch (e: any) {
    suspendError.value = e?.data?.message || e?.message || 'Erro ao suspender grupo.'
  } finally {
    suspendLoading.value = false
  }
}

// ── Reactivate ────────────────────────────────────────────────────────────────
async function confirmReactivate() {
  reactivateLoading.value = true
  try {
    await adminApi.reactivateGroup(groupId)
    group.value = { ...group.value, suspended: false }
    showReactivateModal.value = false
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao reativar grupo.'
    showReactivateModal.value = false
  } finally {
    reactivateLoading.value = false
  }
}
</script>

<template>
  <div>
    <!-- Back link -->
    <NuxtLink
      to="/admin/groups"
      class="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 no-underline transition-colors"
    >
      <ArrowLeft class="w-4 h-4" aria-hidden="true" />
      Voltar para Grupos
    </NuxtLink>

    <!-- Error -->
    <div
      v-if="error"
      role="alert"
      class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4"
    >
      {{ error }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">
      Carregando...
    </div>

    <template v-else-if="group">
      <!-- Page header -->
      <div class="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 class="text-2xl font-bold text-foreground">{{ group.name }}</h1>
          <p class="text-sm text-muted-foreground mt-1">ID: {{ group.id }}</p>
        </div>
        <div class="flex gap-2">
          <BaseButton
            v-if="!group.suspended"
            variant="danger"
            @click="openSuspend"
          >
            Suspender
          </BaseButton>
          <BaseButton
            v-else
            variant="secondary"
            @click="showReactivateModal = true"
          >
            Reativar
          </BaseButton>
        </div>
      </div>

      <!-- Info section -->
      <section aria-labelledby="info-heading" class="rounded-lg border bg-card p-5 mb-6">
        <h2 id="info-heading" class="text-base font-semibold text-foreground mb-4">Informações</h2>
        <dl class="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 text-sm">
          <div>
            <dt class="text-muted-foreground font-medium">Nome</dt>
            <dd class="text-foreground mt-0.5">{{ group.name }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground font-medium">Dono</dt>
            <dd class="text-foreground mt-0.5">{{ group.ownerName ?? group.owner?.name ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground font-medium">Criado em</dt>
            <dd class="text-foreground mt-0.5">{{ formatDate(group.createdAt) }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground font-medium">Plano</dt>
            <dd class="text-foreground mt-0.5">{{ group.plan ?? '—' }}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground font-medium">Status</dt>
            <dd class="mt-0.5">
              <AdminBadgeStatus :status="groupStatus(group)" />
            </dd>
          </div>
        </dl>
      </section>

      <!-- Members table -->
      <section aria-labelledby="members-heading" class="rounded-lg border bg-card p-5 mb-6">
        <h2 id="members-heading" class="text-base font-semibold text-foreground mb-4">
          Membros ({{ group.members?.length ?? 0 }})
        </h2>
        <div class="overflow-x-auto rounded-lg border">
          <Table aria-label="Membros do grupo">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Nome</TableHead>
                <TableHead scope="col">Email</TableHead>
                <TableHead scope="col">Papel</TableHead>
                <TableHead scope="col">Entrou em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="member in (group.members ?? [])" :key="member.id">
                <TableCell class="font-medium">{{ member.name }}</TableCell>
                <TableCell>{{ member.email ?? '—' }}</TableCell>
                <TableCell>{{ member.role ?? '—' }}</TableCell>
                <TableCell>{{ formatDate(member.joinedAt) }}</TableCell>
              </TableRow>
              <TableRow v-if="!group.members?.length">
                <TableCell colspan="4" class="text-center text-muted-foreground italic py-6">
                  Nenhum membro encontrado.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <!-- Seasons list -->
      <section aria-labelledby="seasons-heading" class="rounded-lg border bg-card p-5 mb-6">
        <h2 id="seasons-heading" class="text-base font-semibold text-foreground mb-4">
          Temporadas ({{ group.seasons?.length ?? 0 }})
        </h2>
        <div class="overflow-x-auto rounded-lg border">
          <Table aria-label="Temporadas do grupo">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Ano</TableHead>
                <TableHead scope="col">Sessões</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="season in (group.seasons ?? [])" :key="season.id">
                <TableCell class="font-medium">{{ season.year ?? season.name ?? season.id }}</TableCell>
                <TableCell>{{ season.sessionCount ?? '—' }}</TableCell>
              </TableRow>
              <TableRow v-if="!group.seasons?.length">
                <TableCell colspan="2" class="text-center text-muted-foreground italic py-6">
                  Nenhuma temporada encontrada.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      <!-- Settings section -->
      <section
        v-if="group.settings && Object.keys(group.settings).length > 0"
        aria-labelledby="settings-heading"
        class="rounded-lg border bg-card p-5 mb-6"
      >
        <h2 id="settings-heading" class="text-base font-semibold text-foreground mb-4">Configurações</h2>
        <dl class="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
          <div
            v-for="(value, key) in group.settings"
            :key="key"
            class="flex gap-2 py-1.5 border-b border-border/50 last:border-0"
          >
            <dt class="text-muted-foreground font-medium min-w-[160px] shrink-0">{{ key }}</dt>
            <dd class="text-foreground break-all">{{ value }}</dd>
          </div>
        </dl>
      </section>
    </template>

    <!-- Suspend modal -->
    <BaseModal
      :show="showSuspendModal"
      title="Suspender Grupo"
      @close="closeSuspend"
    >
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          Tem certeza que deseja suspender o grupo
          <strong class="text-foreground">{{ group?.name }}</strong>?
        </p>
        <div class="flex flex-col gap-1">
          <label for="suspend-reason" class="text-sm font-medium text-foreground">
            Motivo <span class="text-destructive" aria-hidden="true">*</span>
          </label>
          <textarea
            id="suspend-reason"
            v-model="suspendReason"
            required
            rows="3"
            placeholder="Descreva o motivo da suspensão..."
            aria-required="true"
            :aria-describedby="suspendError ? 'group-detail-suspend-error' : undefined"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
          <p
            v-if="suspendError"
            id="group-detail-suspend-error"
            class="text-xs text-destructive mt-1"
            role="alert"
          >
            {{ suspendError }}
          </p>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" :disabled="suspendLoading" @click="closeSuspend">
          Cancelar
        </BaseButton>
        <BaseButton variant="danger" :loading="suspendLoading" @click="confirmSuspend">
          Suspender
        </BaseButton>
      </template>
    </BaseModal>

    <!-- Reactivate modal -->
    <BaseModal
      :show="showReactivateModal"
      title="Reativar Grupo"
      @close="showReactivateModal = false"
    >
      <p class="text-sm text-muted-foreground">
        Tem certeza que deseja reativar o grupo
        <strong class="text-foreground">{{ group?.name }}</strong>?
      </p>
      <template #footer>
        <BaseButton variant="secondary" :disabled="reactivateLoading" @click="showReactivateModal = false">
          Cancelar
        </BaseButton>
        <BaseButton :loading="reactivateLoading" @click="confirmReactivate">
          Reativar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'

definePageMeta({ layout: 'admin' })

const adminApi = useAdminApi()
const router = useRouter()

// ── State ─────────────────────────────────────────────────────────────────────
const groups = ref<any[]>([])
const total = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)

const search = ref('')
const page = ref(1)
const pageSize = 20

// Suspend modal
const showSuspendModal = ref(false)
const suspendTarget = ref<any>(null)
const suspendReason = ref('')
const suspendLoading = ref(false)
const suspendError = ref<string | null>(null)

// Reactivate modal
const showReactivateModal = ref(false)
const reactivateTarget = ref<any>(null)
const reactivateLoading = ref(false)

// ── Debounced search ──────────────────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

watch(search, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    fetchGroups()
  }, 350)
})

watch(page, () => fetchGroups())

// ── Data loading ──────────────────────────────────────────────────────────────
async function fetchGroups() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string | number> = { page: page.value, limit: pageSize }
    if (search.value.trim()) params.search = search.value.trim()
    const res = await adminApi.getGroups(params)
    groups.value = res.data ?? res
    total.value = res.total ?? groups.value.length
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar grupos.'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchGroups())

// ── Helpers ───────────────────────────────────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function groupStatus(group: any): 'active' | 'inactive' | 'suspended' {
  if (group.suspended) return 'suspended'
  if (!group.lastSessionAt) return 'inactive'
  const diff = Date.now() - new Date(group.lastSessionAt).getTime()
  return diff > 30 * 24 * 60 * 60 * 1000 ? 'inactive' : 'active'
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

// ── Navigation ────────────────────────────────────────────────────────────────
function goToGroup(id: string | number) {
  router.push(`/admin/groups/${id}`)
}

// ── Suspend ───────────────────────────────────────────────────────────────────
function openSuspend(group: any) {
  suspendTarget.value = group
  suspendReason.value = ''
  suspendError.value = null
  showSuspendModal.value = true
}

function closeSuspend() {
  showSuspendModal.value = false
  suspendTarget.value = null
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
    await adminApi.suspendGroup(suspendTarget.value.id, suspendReason.value.trim())
    const idx = groups.value.findIndex((g) => g.id === suspendTarget.value.id)
    if (idx !== -1) groups.value[idx] = { ...groups.value[idx], suspended: true }
    closeSuspend()
  } catch (e: any) {
    suspendError.value = e?.data?.message || e?.message || 'Erro ao suspender grupo.'
  } finally {
    suspendLoading.value = false
  }
}

// ── Reactivate ────────────────────────────────────────────────────────────────
function openReactivate(group: any) {
  reactivateTarget.value = group
  showReactivateModal.value = true
}

function closeReactivate() {
  showReactivateModal.value = false
  reactivateTarget.value = null
}

async function confirmReactivate() {
  reactivateLoading.value = true
  try {
    await adminApi.reactivateGroup(reactivateTarget.value.id)
    const idx = groups.value.findIndex((g) => g.id === reactivateTarget.value.id)
    if (idx !== -1) groups.value[idx] = { ...groups.value[idx], suspended: false }
    closeReactivate()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao reativar grupo.'
    closeReactivate()
  } finally {
    reactivateLoading.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-foreground">Grupos</h1>
    </div>

    <!-- Search -->
    <div class="mb-4 max-w-sm">
      <Input
        v-model="search"
        type="search"
        placeholder="Buscar por nome ou dono..."
        aria-label="Buscar grupos"
      />
    </div>

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

    <!-- Table -->
    <div v-else class="overflow-x-auto rounded-lg border">
      <Table aria-label="Lista de grupos">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Nome</TableHead>
            <TableHead scope="col">Dono</TableHead>
            <TableHead scope="col">Membros</TableHead>
            <TableHead scope="col">Plano</TableHead>
            <TableHead scope="col">Sessões Total</TableHead>
            <TableHead scope="col">Última Sessão</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="group in groups" :key="group.id">
            <TableCell class="font-medium">{{ group.name }}</TableCell>
            <TableCell>{{ group.ownerName ?? group.owner?.name ?? '—' }}</TableCell>
            <TableCell>{{ group.memberCount ?? '—' }}</TableCell>
            <TableCell>{{ group.plan ?? '—' }}</TableCell>
            <TableCell>{{ group.totalSessions ?? '—' }}</TableCell>
            <TableCell>{{ formatDate(group.lastSessionAt) }}</TableCell>
            <TableCell>
              <AdminBadgeStatus :status="groupStatus(group)" />
            </TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <BaseButton size="sm" variant="secondary" @click="goToGroup(group.id)">
                  Ver
                </BaseButton>
                <BaseButton
                  v-if="!group.suspended"
                  size="sm"
                  variant="danger"
                  @click="openSuspend(group)"
                >
                  Suspender
                </BaseButton>
                <BaseButton
                  v-else
                  size="sm"
                  variant="secondary"
                  @click="openReactivate(group)"
                >
                  Reativar
                </BaseButton>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="groups.length === 0">
            <TableCell colspan="8" class="text-center text-muted-foreground italic py-6">
              Nenhum grupo encontrado.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between mt-4 text-sm text-muted-foreground"
      role="navigation"
      aria-label="Paginação de grupos"
    >
      <span>Página {{ page }} de {{ totalPages }} ({{ total }} grupos)</span>
      <div class="flex gap-2">
        <BaseButton
          size="sm"
          variant="secondary"
          :disabled="page <= 1"
          :aria-label="`Ir para a página anterior (${page - 1})`"
          @click="page--"
        >
          Anterior
        </BaseButton>
        <BaseButton
          size="sm"
          variant="secondary"
          :disabled="page >= totalPages"
          :aria-label="`Ir para a próxima página (${page + 1})`"
          @click="page++"
        >
          Próxima
        </BaseButton>
      </div>
    </div>

    <!-- Suspend modal -->
    <BaseModal
      :show="showSuspendModal"
      title="Suspender Grupo"
      @close="closeSuspend"
    >
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          Tem certeza que deseja suspender o grupo
          <strong class="text-foreground">{{ suspendTarget?.name }}</strong>?
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
            :aria-describedby="suspendError ? 'groups-suspend-error' : undefined"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          />
          <p
            v-if="suspendError"
            id="groups-suspend-error"
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
      @close="closeReactivate"
    >
      <p class="text-sm text-muted-foreground">
        Tem certeza que deseja reativar o grupo
        <strong class="text-foreground">{{ reactivateTarget?.name }}</strong>?
      </p>
      <template #footer>
        <BaseButton variant="secondary" :disabled="reactivateLoading" @click="closeReactivate">
          Cancelar
        </BaseButton>
        <BaseButton :loading="reactivateLoading" @click="confirmReactivate">
          Reativar
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

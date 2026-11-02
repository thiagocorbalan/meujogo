<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: 'admin' })

const adminApi = useAdminApi()
const router = useRouter()

// ── State ─────────────────────────────────────────────────────────────────────

const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const searchInput = ref('')
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = 25

const users = ref<any[]>([])
const total = ref(0)

// Suspend modal
const showSuspendModal = ref(false)
const selectedUser = ref<any>(null)
const suspendReason = ref('')
const suspending = ref(false)
const suspendError = ref<string | null>(null)

// ── Debounced search ──────────────────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null

watchEffect(() => {
  const value = searchInput.value
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchQuery.value = value
    currentPage.value = 1
  }, 300)
})

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const params: Record<string, string | number> = {
      page: currentPage.value,
      limit: pageSize,
    }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    if (statusFilter.value) params.status = statusFilter.value

    const result = await adminApi.getUsers(params)
    users.value = result?.data ?? []
    total.value = result?.total ?? 0
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar usuários.'
  } finally {
    loading.value = false
  }
}

watch([searchQuery, statusFilter, currentPage], fetchUsers, { immediate: true })

// ── Computed pagination ───────────────────────────────────────────────────────

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const pageNumbers = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function userStatus(user: any): 'active' | 'suspended' | 'inactive' {
  if (user.isSuspended) return 'suspended'
  return 'active'
}

// ── Actions ───────────────────────────────────────────────────────────────────

function openSuspendModal(user: any) {
  selectedUser.value = user
  suspendReason.value = ''
  suspendError.value = null
  showSuspendModal.value = true
}

function closeSuspendModal() {
  showSuspendModal.value = false
  selectedUser.value = null
  suspendReason.value = ''
  suspendError.value = null
}

async function onSuspend() {
  if (!selectedUser.value) return
  if (!suspendReason.value.trim()) {
    suspendError.value = 'O motivo é obrigatório.'
    return
  }
  suspending.value = true
  suspendError.value = null
  try {
    await adminApi.suspendUser(selectedUser.value.id, suspendReason.value.trim())
    success.value = `Usuário ${selectedUser.value.name || selectedUser.value.email} suspenso.`
    setTimeout(() => { success.value = null }, 5000)
    closeSuspendModal()
    await fetchUsers()
  } catch (e: any) {
    suspendError.value = e?.data?.message || e?.message || 'Erro ao suspender usuário.'
  } finally {
    suspending.value = false
  }
}

async function onUnsuspend(user: any) {
  error.value = null
  try {
    await adminApi.unsuspendUser(user.id)
    success.value = `Usuário ${user.name || user.email} reativado.`
    setTimeout(() => { success.value = null }, 5000)
    await fetchUsers()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao reativar usuário.'
  }
}

function goToUser(id: number) {
  router.push(`/admin/users/${id}`)
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-foreground mb-6">Usuários</h1>

    <!-- Feedback banners -->
    <div
      v-if="error"
      role="alert"
      class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4"
    >
      {{ error }}
    </div>
    <div
      v-if="success"
      role="status"
      class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-700 text-sm mb-4"
    >
      {{ success }}
    </div>

    <!-- Filters row -->
    <div class="flex flex-wrap items-end gap-4 mb-5">
      <div class="flex flex-col gap-1 min-w-[240px] flex-1">
        <Label for="users-search">Buscar</Label>
        <Input
          id="users-search"
          v-model="searchInput"
          type="search"
          placeholder="Nome ou email..."
          autocomplete="off"
        />
      </div>
      <div class="flex flex-col gap-1 min-w-[160px]">
        <Label for="users-status">Status</Label>
        <select
          id="users-status"
          v-model="statusFilter"
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Ativo</option>
          <option value="SUSPENDED">Suspenso</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="w-full overflow-x-auto rounded-lg border bg-background">
      <Table aria-label="Lista de usuarios">
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Nome</TableHead>
            <TableHead scope="col">Email</TableHead>
            <TableHead scope="col">Grupos</TableHead>
            <TableHead scope="col">Criado em</TableHead>
            <TableHead scope="col">Último Login</TableHead>
            <TableHead scope="col">Status</TableHead>
            <TableHead scope="col">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell :colspan="7" class="text-center text-muted-foreground py-10">
              Carregando...
            </TableCell>
          </TableRow>
          <template v-else>
            <TableRow
              v-for="user in users"
              :key="user.id"
            >
              <TableCell class="font-medium">{{ user.name || '—' }}</TableCell>
              <TableCell>{{ user.email }}</TableCell>
              <TableCell>{{ user._count?.memberships ?? user.groupCount ?? '—' }}</TableCell>
              <TableCell>{{ formatDate(user.createdAt) }}</TableCell>
              <TableCell>{{ formatDate(user.lastLoginAt) }}</TableCell>
              <TableCell>
                <AdminBadgeStatus :status="userStatus(user)" />
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    @click="goToUser(user.id)"
                  >
                    Ver
                  </BaseButton>
                  <BaseButton
                    v-if="user.isSuspended"
                    variant="secondary"
                    size="sm"
                    @click="onUnsuspend(user)"
                  >
                    Reativar
                  </BaseButton>
                  <BaseButton
                    v-else
                    variant="danger"
                    size="sm"
                    @click="openSuspendModal(user)"
                  >
                    Suspender
                  </BaseButton>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="users.length === 0">
              <TableCell :colspan="7" class="text-center text-muted-foreground italic py-10">
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Pagination -->
    <div
      v-if="totalPages > 1"
      class="flex items-center justify-between mt-4 gap-2"
      role="navigation"
      aria-label="Paginação de usuários"
    >
      <p class="text-sm text-muted-foreground">
        {{ total }} usuário{{ total !== 1 ? 's' : '' }} no total
      </p>
      <div class="flex items-center gap-1">
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="currentPage <= 1"
          :aria-label="`Ir para a página anterior (${currentPage - 1})`"
          @click="currentPage--"
        >
          &lsaquo;
        </BaseButton>
        <BaseButton
          v-for="n in pageNumbers"
          :key="n"
          :variant="n === currentPage ? 'primary' : 'secondary'"
          size="sm"
          :aria-label="`Ir para a página ${n}`"
          :aria-current="n === currentPage ? 'page' : undefined"
          @click="currentPage = n"
        >
          {{ n }}
        </BaseButton>
        <BaseButton
          variant="secondary"
          size="sm"
          :disabled="currentPage >= totalPages"
          :aria-label="`Ir para a próxima página (${currentPage + 1})`"
          @click="currentPage++"
        >
          &rsaquo;
        </BaseButton>
      </div>
    </div>

    <!-- Suspend Modal -->
    <BaseModal
      :show="showSuspendModal"
      :title="`Suspender ${selectedUser?.name || selectedUser?.email || 'Usuário'}`"
      @close="closeSuspendModal"
    >
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          Informe o motivo da suspensão. O usuário não conseguirá acessar a plataforma enquanto estiver suspenso.
        </p>
        <div class="flex flex-col gap-1">
          <Label for="suspend-reason-input">
            Motivo <span aria-hidden="true" class="text-destructive">*</span>
          </Label>
          <textarea
            id="suspend-reason-input"
            v-model="suspendReason"
            rows="3"
            aria-required="true"
            :aria-describedby="suspendError ? 'suspend-reason-error' : undefined"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            placeholder="Ex: Violação dos Termos de Uso..."
          />
          <p
            v-if="suspendError"
            id="suspend-reason-error"
            class="text-sm text-destructive"
            role="alert"
          >
            {{ suspendError }}
          </p>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="closeSuspendModal">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="suspending" @click="onSuspend">
          Confirmar Suspensão
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

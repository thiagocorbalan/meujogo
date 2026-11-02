<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

definePageMeta({ layout: 'admin' })

const route = useRoute()
const router = useRouter()
const adminApi = useAdminApi()

const userId = computed(() => route.params.id as string)

// ── State ─────────────────────────────────────────────────────────────────────

const loading = ref(true)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const user = ref<any>(null)

// Suspend modal
const showSuspendModal = ref(false)
const suspendReason = ref('')
const suspending = ref(false)
const suspendError = ref<string | null>(null)

// Impersonate
const impersonating = ref(false)

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchUser() {
  loading.value = true
  error.value = null
  try {
    user.value = await adminApi.getUser(userId.value)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar usuário.'
  } finally {
    loading.value = false
  }
}

onMounted(fetchUser)

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function userStatus(u: any): 'active' | 'suspended' | 'inactive' {
  if (u?.isSuspended) return 'suspended'
  return 'active'
}

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    DONO: 'Dono',
    ADMIN: 'Admin',
    JOGADOR: 'Jogador',
  }
  return map[role] ?? role
}

const userGroups = computed<any[]>(() => {
  return user.value?.memberships ?? user.value?.groups ?? []
})

// ── Suspend / Unsuspend ───────────────────────────────────────────────────────

function openSuspendModal() {
  suspendReason.value = ''
  suspendError.value = null
  showSuspendModal.value = true
}

function closeSuspendModal() {
  showSuspendModal.value = false
  suspendReason.value = ''
  suspendError.value = null
}

async function onSuspend() {
  if (!suspendReason.value.trim()) {
    suspendError.value = 'O motivo é obrigatório.'
    return
  }
  suspending.value = true
  suspendError.value = null
  try {
    await adminApi.suspendUser(userId.value, suspendReason.value.trim())
    success.value = 'Usuário suspenso com sucesso.'
    setTimeout(() => { success.value = null }, 5000)
    closeSuspendModal()
    await fetchUser()
  } catch (e: any) {
    suspendError.value = e?.data?.message || e?.message || 'Erro ao suspender usuário.'
  } finally {
    suspending.value = false
  }
}

async function onUnsuspend() {
  error.value = null
  try {
    await adminApi.unsuspendUser(userId.value)
    success.value = 'Usuário reativado com sucesso.'
    setTimeout(() => { success.value = null }, 5000)
    await fetchUser()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao reativar usuário.'
  }
}

// ── Impersonate ───────────────────────────────────────────────────────────────

async function onImpersonate() {
  impersonating.value = true
  error.value = null
  try {
    const result = await adminApi.impersonateUser(userId.value)
    const { token } = result
    const { baseURL } = adminApi
    // Open the app in a new tab with the impersonation token as a query param
    const url = `${baseURL || ''}/auth/impersonate?token=${encodeURIComponent(token)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao impersonar usuário.'
  } finally {
    impersonating.value = false
  }
}
</script>

<template>
  <div>
    <!-- Back navigation -->
    <div class="mb-4">
      <BaseButton variant="secondary" size="sm" @click="router.push('/admin/users')">
        &larr; Voltar para Usuários
      </BaseButton>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">
      Carregando...
    </div>

    <!-- Error (fatal) -->
    <div
      v-else-if="error && !user"
      role="alert"
      class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm"
    >
      {{ error }}
    </div>

    <template v-else-if="user">
      <!-- Page header -->
      <div class="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 class="text-2xl font-bold text-foreground">{{ user.name || user.email }}</h1>
          <p v-if="user.name" class="text-sm text-muted-foreground mt-1">{{ user.email }}</p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <BaseButton
            v-if="user.isSuspended"
            variant="secondary"
            @click="onUnsuspend"
          >
            Reativar
          </BaseButton>
          <BaseButton
            v-else
            variant="danger"
            @click="openSuspendModal"
          >
            Suspender
          </BaseButton>
          <BaseButton
            :loading="impersonating"
            variant="secondary"
            @click="onImpersonate"
          >
            Impersonar
          </BaseButton>
        </div>
      </div>

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

      <!-- Info card -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <div>
              <dt class="text-muted-foreground font-medium mb-0.5">Nome</dt>
              <dd class="font-semibold">{{ user.name || '—' }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground font-medium mb-0.5">Email</dt>
              <dd>{{ user.email }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground font-medium mb-0.5">Perfil</dt>
              <dd>{{ user.isSuperAdmin ? 'Superadmin' : 'Usuário' }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground font-medium mb-0.5">Status</dt>
              <dd>
                <AdminBadgeStatus :status="userStatus(user)" />
              </dd>
            </div>
            <div>
              <dt class="text-muted-foreground font-medium mb-0.5">Criado em</dt>
              <dd>{{ formatDate(user.createdAt) }}</dd>
            </div>
            <div>
              <dt class="text-muted-foreground font-medium mb-0.5">Último Login</dt>
              <dd>{{ formatDateTime(user.lastLoginAt) }}</dd>
            </div>
            <div v-if="user.isSuspended && user.suspendedReason" class="sm:col-span-2">
              <dt class="text-muted-foreground font-medium mb-0.5">Motivo da Suspensão</dt>
              <dd class="text-destructive">{{ user.suspendedReason }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <!-- Groups table -->
      <Card>
        <CardHeader>
          <CardTitle>Grupos</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div class="overflow-x-auto">
            <Table aria-label="Grupos do usuário">
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Grupo</TableHead>
                  <TableHead scope="col">Função</TableHead>
                  <TableHead scope="col">Entrou em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="membership in userGroups" :key="membership.id ?? membership.groupId">
                  <TableCell class="font-medium">
                    {{ membership.group?.name ?? membership.groupName ?? '—' }}
                  </TableCell>
                  <TableCell>{{ roleLabel(membership.role) }}</TableCell>
                  <TableCell>{{ formatDate(membership.createdAt) }}</TableCell>
                </TableRow>
                <TableRow v-if="userGroups.length === 0">
                  <TableCell :colspan="3" class="text-center text-muted-foreground italic py-8">
                    Nenhum grupo encontrado.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </template>

    <!-- Suspend Modal -->
    <BaseModal
      :show="showSuspendModal"
      :title="`Suspender ${user?.name || user?.email || 'Usuário'}`"
      @close="closeSuspendModal"
    >
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          Informe o motivo da suspensão. O usuário não conseguirá acessar a plataforma enquanto estiver suspenso.
        </p>
        <div class="flex flex-col gap-1">
          <label
            for="detail-suspend-reason"
            class="text-sm font-medium leading-none"
          >
            Motivo <span aria-hidden="true" class="text-destructive">*</span>
          </label>
          <textarea
            id="detail-suspend-reason"
            v-model="suspendReason"
            rows="3"
            aria-required="true"
            :aria-describedby="suspendError ? 'detail-suspend-error' : undefined"
            class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            placeholder="Ex: Violação dos Termos de Uso..."
          />
          <p
            v-if="suspendError"
            id="detail-suspend-error"
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

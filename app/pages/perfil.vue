<template>
  <div class="max-w-[800px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-6">Meu Perfil</h1>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div v-if="successMessage" class="rounded-lg border border-green-500 bg-green-500/10 p-4 text-green-700 dark:text-green-400 text-sm mb-4">
      <p>{{ successMessage }}</p>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <template v-else-if="player">
      <!-- Stats Cards (always read-only) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent class="pt-6">
            <p class="text-sm font-medium text-muted-foreground mb-1">ELO</p>
            <p class="text-3xl font-bold text-foreground">{{ Math.round(player.elo ?? 1200) }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <p class="text-sm font-medium text-muted-foreground mb-1">Total de Gols</p>
            <p class="text-3xl font-bold text-foreground">{{ player.goals ?? 0 }}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent class="pt-6">
            <p class="text-sm font-medium text-muted-foreground mb-1">Total de Jogos</p>
            <p class="text-3xl font-bold text-foreground">{{ player.games ?? 0 }}</p>
          </CardContent>
        </Card>
      </div>

      <!-- Personal Info -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
        </CardHeader>
        <CardContent>
          <!-- View Mode -->
          <div v-if="!editing" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-muted-foreground">Nome:</span>
                <span class="ml-2 font-medium text-foreground">{{ player.name }}</span>
              </div>
              <div>
                <span class="text-muted-foreground">Email:</span>
                <span v-if="userEmail" class="ml-2 font-medium text-foreground">{{ userEmail }}</span>
                <span v-else class="ml-2 text-muted-foreground italic">Sem conta vinculada</span>
              </div>
              <div>
                <span class="text-muted-foreground">Posição:</span>
                <Badge class="ml-2" variant="secondary">{{ positionLabel(player.position) }}</Badge>
              </div>
              <div>
                <span class="text-muted-foreground">Status:</span>
                <Badge class="ml-2" :class="statusBadgeClass(player.status ?? 'ATIVO')">
                  {{ statusLabel(player.status ?? 'ATIVO') }}
                </Badge>
              </div>
            </div>

            <div class="pt-4">
              <Button @click="startEditing">Editar Perfil</Button>
            </div>
          </div>

          <!-- Edit Mode -->
          <div v-else class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  v-model="form.name"
                  placeholder="Seu nome"
                />
              </div>
              <div class="space-y-2">
                <Label for="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  :model-value="userEmail || 'Sem conta vinculada'"
                  disabled
                  class="bg-muted cursor-not-allowed"
                />
              </div>
              <div class="space-y-2">
                <Label>Posição</Label>
                <Select v-model="form.position">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a posição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LINHA">Linha</SelectItem>
                    <SelectItem value="GOLEIRO">Goleiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-2">
                <Label>Status</Label>
                <Select v-model="form.status">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="LESIONADO">Lesionado</SelectItem>
                    <SelectItem value="AUSENTE">Ausente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="flex gap-3 pt-4">
              <Button :disabled="saving" @click="saveProfile">
                <span v-if="saving">Salvando...</span>
                <span v-else>Salvar</span>
              </Button>
              <Button variant="outline" :disabled="saving" @click="cancelEditing">
                Cancelar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Attendance -->
      <Card>
        <CardHeader>
          <CardTitle>Presenças Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div v-if="recentAttendance.length === 0" class="text-sm text-muted-foreground italic">
            Nenhuma presença registrada.
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="att in recentAttendance"
              :key="att.id"
              class="flex items-center justify-between py-2 px-3 rounded-md border"
            >
              <div class="text-sm text-foreground">
                Sessão #{{ att.sessionId }} — {{ formatDate(att.createdAt ?? att.session?.createdAt) }}
              </div>
              <Badge :class="attendanceBadgeClass(att.status)">
                {{ attendanceLabel(att.status) }}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </template>

    <div v-else class="text-muted-foreground text-base py-10 text-center">
      Nenhum perfil de jogador encontrado neste grupo.
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const groupsStore = useGroupsStore()
const authStore = useAuthStore()
const { getMe, updateMyProfile } = usePlayers()

const loading = ref(true)
const error = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const player = ref<any>(null)
const recentAttendance = ref<any[]>([])
const editing = ref(false)
const saving = ref(false)

const form = ref({
  name: '',
  position: '',
  status: '',
})

const activeGroupId = computed(() => groupsStore.activeGroupId)
const userEmail = computed(() => authStore.user?.email ?? null)

onMounted(async () => {
  if (!activeGroupId.value) {
    error.value = 'Nenhum grupo selecionado.'
    loading.value = false
    return
  }
  await fetchProfile()
})

async function fetchProfile() {
  loading.value = true
  error.value = null
  try {
    const data = await getMe() as any
    player.value = data
    if (data?.id) {
      await fetchRecentAttendance(data.id)
    }
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar perfil.'
  } finally {
    loading.value = false
  }
}

async function fetchRecentAttendance(playerId: number) {
  try {
    const { fetch } = useApi()
    const data = (await fetch(`/attendance/player/${playerId}?limit=5`)) as any[]
    recentAttendance.value = Array.isArray(data) ? data : []
  } catch {
    // Attendance endpoint may not exist yet — silently ignore
    recentAttendance.value = []
  }
}

function startEditing() {
  form.value = {
    name: player.value?.name ?? '',
    position: player.value?.position ?? 'LINHA',
    status: player.value?.status ?? 'ATIVO',
  }
  successMessage.value = null
  editing.value = true
}

function cancelEditing() {
  editing.value = false
  error.value = null
}

async function saveProfile() {
  saving.value = true
  error.value = null
  successMessage.value = null
  try {
    await updateMyProfile({
      name: form.value.name,
      position: form.value.position,
      status: form.value.status,
    })
    editing.value = false
    successMessage.value = 'Perfil atualizado com sucesso!'
    await fetchProfile()
    // Auto-dismiss success message after 4 seconds
    setTimeout(() => {
      successMessage.value = null
    }, 4000)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar perfil.'
  } finally {
    saving.value = false
  }
}

function positionLabel(position: string): string {
  switch (position) {
    case 'LINHA': return 'Linha'
    case 'GOLEIRO': return 'Goleiro'
    default: return position ?? '—'
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'ATIVO': return 'Ativo'
    case 'LESIONADO': return 'Lesionado'
    case 'AUSENTE': return 'Ausente'
    default: return status ?? '—'
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'ATIVO': return 'bg-green-600 text-white border-transparent hover:bg-green-600/80'
    case 'LESIONADO': return 'bg-red-500 text-white border-transparent hover:bg-red-500/80'
    case 'AUSENTE': return 'bg-yellow-500 text-white border-transparent hover:bg-yellow-500/80'
    default: return ''
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

function attendanceLabel(status: string): string {
  switch (status) {
    case 'ATIVO': return 'Presente'
    case 'AUSENTE': return 'Ausente'
    case 'PENDENTE': return 'Pendente'
    default: return status ?? '—'
  }
}

function attendanceBadgeClass(status: string): string {
  switch (status) {
    case 'ATIVO': return 'bg-green-600 text-white border-transparent hover:bg-green-600/80'
    case 'AUSENTE': return 'bg-red-500 text-white border-transparent hover:bg-red-500/80'
    case 'PENDENTE': return 'bg-yellow-500 text-white border-transparent hover:bg-yellow-500/80'
    default: return ''
  }
}
</script>

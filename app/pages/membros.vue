<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const groupsStore = useGroupsStore()
const { getMembers, addGuestPlayer, regenerateInviteCode, removeMember, updateMemberRole, suspendMember, reactivateMember } = useGroups()
const { canConfirmOthers } = usePermissions()

const loading = ref(true)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const members = ref<any[]>([])
const copied = ref(false)
const regenerating = ref(false)

// Modal state
const selectedMember = ref<any>(null)
const showRoleModal = ref(false)
const showSuspendModal = ref(false)
const showRemoveModal = ref(false)
const selectedRole = ref('JOGADOR')
const savingRole = ref(false)
const suspending = ref(false)
const removing = ref(false)

// Invite guest state
const showInviteGuestModal = ref(false)
const copiedGuest = ref(false)

const guestInviteLink = computed(() => {
  const code = activeGroup.value?.group?.inviteCode ?? activeGroup.value?.inviteCode
  const playerId = selectedMember.value?.playerId
  if (!code || !playerId) return ''
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/convite/${code}?linkPlayer=${playerId}`
  }
  return `/convite/${code}?linkPlayer=${playerId}`
})

// Guest player state
const showGuestDialog = ref(false)
const addingGuest = ref(false)
const guestError = ref<string | null>(null)
const guestForm = ref({
  name: '',
  position: 'LINHA',
})

const activeGroupId = computed(() => groupsStore.activeGroupId)
const activeGroup = computed(() => groupsStore.activeGroup)

const inviteLink = computed(() => {
  const code = activeGroup.value?.group?.inviteCode ?? activeGroup.value?.inviteCode
  if (!code) return ''
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/convite/${code}`
  }
  return `/convite/${code}`
})

onMounted(async () => {
  if (!activeGroupId.value) {
    error.value = 'Nenhum grupo selecionado.'
    loading.value = false
    return
  }
  await fetchMembers()
})

async function fetchMembers() {
  loading.value = true
  error.value = null
  try {
    members.value = (await getMembers(activeGroupId.value!)) as any[]
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar membros.'
  } finally {
    loading.value = false
  }
}

function memberName(member: any): string {
  return member.player?.name || member.user?.name || '—'
}

function roleLabel(role: string): string {
  switch (role) {
    case 'DONO': return 'Dono'
    case 'ADMIN': return 'Admin'
    case 'JOGADOR': return 'Jogador'
    default: return role
  }
} 

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'DONO': return 'bg-purple-600 text-white border-transparent hover:bg-purple-600/80'
    case 'ADMIN': return 'bg-blue-600 text-white border-transparent hover:bg-blue-600/80'
    case 'JOGADOR': return 'bg-gray-500 text-white border-transparent hover:bg-gray-500/80'
    default: return ''
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

async function copyInviteLink() {
  if (!inviteLink.value) return
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    error.value = 'Erro ao copiar link.'
  }
}

async function onRegenerateInviteCode() {
  if (!activeGroupId.value) return
  regenerating.value = true
  error.value = null
  try {
    await regenerateInviteCode(activeGroupId.value)
    // Update the groups store to reflect the new invite code
    await groupsStore.fetchGroups()
    success.value = 'Código de convite regenerado com sucesso.'
    setTimeout(() => { success.value = null }, 4000)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao regenerar código de convite.'
  } finally {
    regenerating.value = false
  }
}

// Modal openers
function openRoleModal(member: any) {
  selectedMember.value = member
  selectedRole.value = member.role === 'ADMIN' ? 'ADMIN' : 'JOGADOR'
  showRoleModal.value = true
}

function openSuspendModal(member: any) {
  selectedMember.value = member
  showSuspendModal.value = true
}

function openRemoveModal(member: any) {
  selectedMember.value = member
  showRemoveModal.value = true
}

function openInviteGuestModal(member: any) {
  selectedMember.value = member
  showInviteGuestModal.value = true
  copiedGuest.value = false
}

async function copyGuestInviteLink() {
  if (!guestInviteLink.value) return
  try {
    await navigator.clipboard.writeText(guestInviteLink.value)
    copiedGuest.value = true
    setTimeout(() => { copiedGuest.value = false }, 2000)
  } catch {
    error.value = 'Erro ao copiar link.'
  }
}

// Actions
async function onSaveRole() {
  if (!activeGroupId.value || !selectedMember.value) return
  savingRole.value = true
  error.value = null
  try {
    await updateMemberRole(activeGroupId.value, selectedMember.value.id, selectedRole.value)
    success.value = `Função de ${memberName(selectedMember.value)} atualizada para ${roleLabel(selectedRole.value)}.`
    setTimeout(() => { success.value = null }, 4000)
    showRoleModal.value = false
    selectedMember.value = null
    await fetchMembers()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao atualizar função do membro.'
  } finally {
    savingRole.value = false
  }
}

async function onSuspend() {
  if (!activeGroupId.value || !selectedMember.value) return
  suspending.value = true
  error.value = null
  try {
    await suspendMember(activeGroupId.value, selectedMember.value.id)
    success.value = `${memberName(selectedMember.value)} foi suspenso.`
    setTimeout(() => { success.value = null }, 4000)
    showSuspendModal.value = false
    selectedMember.value = null
    await fetchMembers()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao suspender membro.'
  } finally {
    suspending.value = false
  }
}

async function onReactivate(member: any) {
  if (!activeGroupId.value) return
  error.value = null
  try {
    await reactivateMember(activeGroupId.value, member.id)
    success.value = `${memberName(member)} foi reativado.`
    setTimeout(() => { success.value = null }, 4000)
    await fetchMembers()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao reativar membro.'
  }
}

async function onRemove() {
  if (!activeGroupId.value || !selectedMember.value) return
  removing.value = true
  error.value = null
  try {
    await removeMember(activeGroupId.value, selectedMember.value.id)
    success.value = `${memberName(selectedMember.value)} removido do grupo.`
    setTimeout(() => { success.value = null }, 4000)
    showRemoveModal.value = false
    selectedMember.value = null
    await fetchMembers()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao remover membro.'
  } finally {
    removing.value = false
  }
}

function closeGuestDialog() {
  showGuestDialog.value = false
  guestForm.value = { name: '', position: 'LINHA' }
  guestError.value = null
}

async function onAddGuest() {
  if (!activeGroupId.value) return
  if (!guestForm.value.name.trim()) {
    guestError.value = 'Nome é obrigatório.'
    return
  }
  addingGuest.value = true
  guestError.value = null
  try {
    await addGuestPlayer(activeGroupId.value, {
      name: guestForm.value.name.trim(),
      position: guestForm.value.position,
    })
    closeGuestDialog()
    success.value = 'Jogador avulso adicionado com sucesso.'
    setTimeout(() => { success.value = null }, 4000)
    await fetchMembers()
  } catch (e: any) {
    guestError.value = e?.data?.message || e?.message || 'Erro ao adicionar jogador avulso.'
  } finally {
    addingGuest.value = false
  }
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-5">Membros</h1>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div v-if="success" class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-700 text-sm mb-4">
      <p>{{ success }}</p>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <template v-else>
      <!-- Invite Section -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Link de Convite</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="flex flex-col gap-3">
            <div class="flex items-center gap-2">
              <Input :model-value="inviteLink" readonly class="flex-1 bg-muted" />
              <BaseButton variant="secondary" size="sm" @click="copyInviteLink">
                {{ copied ? 'Copiado!' : 'Copiar link' }}
              </BaseButton>
            </div>
            <div>
              <BaseButton variant="secondary" size="sm" :loading="regenerating" @click="onRegenerateInviteCode">
                Regenerar código
              </BaseButton>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="mb-6">
        <BaseButton @click="showGuestDialog = true">Adicionar jogador avulso</BaseButton>
      </div>

      <div class="w-full overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Posição</TableHead>
              <TableHead>ELO</TableHead>
              <TableHead>Membro desde</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="member in members" :key="member.id">
              <TableCell>
                <div class="flex items-center gap-2">
                  <span>{{ memberName(member) }}</span>
                  <Badge
                    v-if="member.player?.type === 'CONVIDADO'"
                    class="bg-orange-500 text-white border-transparent hover:bg-orange-500/80"
                  >
                    Avulso
                  </Badge>
                  <Badge
                    v-if="member.player?.status === 'AUSENTE'"
                    class="bg-amber-500 text-white border-transparent"
                  >
                    Suspenso
                  </Badge>
                </div>
              </TableCell>
              <TableCell>{{ member.user?.email || '-' }}</TableCell>
              <TableCell>
                <Badge :class="roleBadgeClass(member.role)">
                  {{ roleLabel(member.role) }}
                </Badge>
              </TableCell>
              <TableCell>{{ member.player?.position ?? '—' }}</TableCell>
              <TableCell>{{ member.player?.elo != null ? Math.round(member.player.elo) : '—' }}</TableCell>
              <TableCell>{{ formatDate(member.createdAt) }}</TableCell>
              <TableCell>
                <div v-if="member.role !== 'DONO'" class="flex items-center gap-2">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    @click="openRoleModal(member)"
                  >
                    Editar Função
                  </BaseButton>
                  <BaseButton
                    v-if="member.player?.status === 'AUSENTE'"
                    variant="secondary"
                    size="sm"
                    @click="onReactivate(member)"
                  >
                    Reativar
                  </BaseButton>
                  <BaseButton
                    v-else
                    variant="secondary"
                    size="sm"
                    @click="openSuspendModal(member)"
                  >
                    Suspender
                  </BaseButton>
                  <BaseButton
                    v-if="member.player?.type === 'CONVIDADO' && !member.userId"
                    variant="secondary"
                    size="sm"
                    @click="openInviteGuestModal(member)"
                  >
                    Convidar
                  </BaseButton>
                  <BaseButton
                    variant="danger"
                    size="sm"
                    @click="openRemoveModal(member)"
                  >
                    Remover
                  </BaseButton>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="members.length === 0">
              <TableCell :colspan="canConfirmOthers() ? 8 : 5" class="text-center text-muted-foreground italic py-6">
                Nenhum membro encontrado.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </template>

    <!-- Edit Role Modal -->
    <BaseModal :show="showRoleModal" :title="`Editar Função de ${selectedMember ? memberName(selectedMember) : ''}`" @close="showRoleModal = false">
      <div class="flex flex-col gap-2">
        <Label>Função</Label>
        <select
          v-model="selectedRole"
          class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="ADMIN">Admin</option>
          <option value="JOGADOR">Jogador</option>
        </select>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showRoleModal = false">Cancelar</BaseButton>
        <BaseButton :loading="savingRole" @click="onSaveRole">Salvar</BaseButton>
      </template>
    </BaseModal>

    <!-- Suspend Member Modal -->
    <BaseModal :show="showSuspendModal" title="Suspender Membro" @close="showSuspendModal = false">
      <p class="text-sm text-muted-foreground">
        Tem certeza que deseja suspender <strong>{{ selectedMember ? memberName(selectedMember) : '' }}</strong>?
        O jogador não poderá participar das próximas sessões até ser reativado.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showSuspendModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="suspending" @click="onSuspend">Confirmar Suspensão</BaseButton>
      </template>
    </BaseModal>

    <!-- Remove Member Modal -->
    <BaseModal :show="showRemoveModal" title="Remover Membro" @close="showRemoveModal = false">
      <p class="text-sm text-muted-foreground">
        Tem certeza que deseja remover <strong>{{ selectedMember ? memberName(selectedMember) : '' }}</strong> do grupo?
        Esta ação pode ser revertida.
      </p>
      <template #footer>
        <BaseButton variant="secondary" @click="showRemoveModal = false">Cancelar</BaseButton>
        <BaseButton variant="danger" :loading="removing" @click="onRemove">Confirmar Remoção</BaseButton>
      </template>
    </BaseModal>

    <!-- Invite Guest Modal -->
    <BaseModal :show="showInviteGuestModal" :title="`Convidar ${selectedMember ? memberName(selectedMember) : ''}`" @close="showInviteGuestModal = false">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-muted-foreground">
          Envie o link abaixo para <strong>{{ selectedMember ? memberName(selectedMember) : '' }}</strong> para que ele(a) crie uma conta e entre no grupo. Os dados de partidas e ELO serão preservados automaticamente.
        </p>
        <div class="flex flex-col gap-1">
          <Label>Link de convite personalizado</Label>
          <div class="flex items-center gap-2">
            <Input :model-value="guestInviteLink" readonly class="flex-1 bg-muted text-sm" />
            <BaseButton variant="secondary" size="sm" @click="copyGuestInviteLink">
              {{ copiedGuest ? 'Copiado!' : 'Copiar' }}
            </BaseButton>
          </div>
        </div>
        <div class="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-700">
          <p><strong>Como funciona:</strong> Ao acessar o link, o jogador poderá se cadastrar ou fazer login. Ao entrar no grupo, a conta será vinculada automaticamente ao jogador avulso, preservando todo o histórico (ELO, gols, jogos).</p>
        </div>
      </div>
      <template #footer>
        <BaseButton variant="secondary" @click="showInviteGuestModal = false">Fechar</BaseButton>
      </template>
    </BaseModal>

    <!-- Add Guest Player Dialog -->
    <BaseModal :show="showGuestDialog" title="Adicionar Jogador Avulso" @close="closeGuestDialog">
      <form class="flex flex-col gap-4" @submit.prevent="onAddGuest">
        <div class="flex flex-col gap-1">
          <Label>Nome</Label>
          <Input v-model="guestForm.name" type="text" placeholder="Nome do jogador" required />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Posição</Label>
          <select
            v-model="guestForm.position"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="LINHA">Linha</option>
            <option value="GOLEIRO">Goleiro</option>
          </select>
        </div>
        <div v-if="guestError" class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm">
          <p>{{ guestError }}</p>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeGuestDialog">Cancelar</BaseButton>
        <BaseButton :loading="addingGuest" @click="onAddGuest">Adicionar</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<template>
  <div class="max-w-[900px] mx-auto p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-3xl font-bold text-foreground">Usuários</h1>
      <BaseButton v-if="canCreate('users')" @click="openNew">Novo Usuário</BaseButton>
    </div>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <div v-else-if="users.length" class="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel</TableHead>
            <TableHead v-if="canEdit('users') || canDelete('users')">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="u in users" :key="u.id">
            <TableCell>{{ u.name }}</TableCell>
            <TableCell>{{ u.email }}</TableCell>
            <TableCell>
              <Badge :variant="roleBadgeVariant(u.role)">{{ u.role }}</Badge>
            </TableCell>
            <TableCell v-if="canEdit('users') || canDelete('users')">
              <div class="flex gap-2">
                <BaseButton v-if="canEdit('users')" size="sm" variant="secondary" @click="openEdit(u)">Editar</BaseButton>
                <BaseButton v-if="canDelete('users')" size="sm" variant="danger" @click="confirmDelete(u)">Excluir</BaseButton>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <p v-else class="text-muted-foreground text-sm text-center py-10">Nenhum usuário cadastrado.</p>
<BaseModal :show="showForm" :title="editingUser ? 'Editar Usuário' : 'Novo Usuário'" @close="closeForm">
      <form @submit.prevent="onSave" class="flex flex-col gap-4">
        <div class="flex flex-col gap-1">
          <Label>Nome</Label>
          <Input v-model="form.name" type="text" required />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Email</Label>
          <Input v-model="form.email" type="email" required />
        </div>
        <div class="flex flex-col gap-1">
          <Label>Senha</Label>
          <div class="relative">
            <Input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :required="!editingUser"
              :placeholder="editingUser ? 'Deixe em branco para manter a atual' : ''"
              class="pr-10"
              @input="validatePassword"
            />
            <button
              type="button"
              class="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-muted-foreground hover:text-foreground p-1"
              :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" class="w-4 h-4" />
              <Eye v-else class="w-4 h-4" />
            </button>
          </div>
          <p v-if="passwordError" class="text-xs text-destructive mt-1">{{ passwordError }}</p>
        </div>
        <div class="flex flex-col gap-1">
          <Label>Papel</Label>
          <select v-model="form.role" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option value="ADMIN">Admin</option>
            <option value="MODERADOR">Moderador</option>
            <option value="USUARIO">Usuário</option>
          </select>
        </div>
      </form>
      <template #footer>
        <BaseButton variant="secondary" @click="closeForm">Cancelar</BaseButton>
        <BaseButton @click="onSave">Salvar</BaseButton>
      </template>
    </BaseModal>
<BaseModal :show="showDeleteConfirm" title="Confirmar Exclusão" @close="showDeleteConfirm = false">
      <p>Deseja realmente excluir <strong>{{ deleting?.name }}</strong>?</p>
      <template #footer>
        <BaseButton variant="secondary" @click="showDeleteConfirm = false">Cancelar</BaseButton>
        <BaseButton variant="danger" @click="onDelete">Excluir</BaseButton>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff } from 'lucide-vue-next'

const { canCreate, canEdit, canDelete } = usePermissions()
const { getUsers, createUser, updateUser, deleteUser } = useUsers()

const users = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const editingUser = ref<any>(null)
const showDeleteConfirm = ref(false)
const deleting = ref<any>(null)

const form = ref({ name: '', email: '', password: '', role: 'USUARIO' })
const showPassword = ref(false)
const passwordError = ref<string | null>(null)

onMounted(async () => {
  try {
    users.value = await getUsers() as any[]
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar usuários.'
  } finally {
    loading.value = false
  }
})

function roleBadgeVariant(role: string) {
  const map: Record<string, string> = {
    ADMIN: 'destructive',
    MODERADOR: 'secondary',
    USUARIO: 'outline',
  }
  return (map[role] ?? 'secondary') as any
}

function validatePassword() {
  if (!form.value.password) {
    passwordError.value = null
    return true
  }
  if (form.value.password.length < 8) {
    passwordError.value = 'A senha deve ter no mínimo 8 caracteres.'
    return false
  }
  passwordError.value = null
  return true
}

function openNew() {
  editingUser.value = null
  form.value = { name: '', email: '', password: '', role: 'USUARIO' }
  showPassword.value = false
  passwordError.value = null
  showForm.value = true
}

function openEdit(user: any) {
  editingUser.value = user
  form.value = { name: user.name, email: user.email, password: '', role: user.role }
  showPassword.value = false
  passwordError.value = null
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingUser.value = null
  showPassword.value = false
  passwordError.value = null
}

async function onSave() {
  error.value = null

  if (form.value.password && !validatePassword()) return
  if (!editingUser.value && !form.value.password) {
    passwordError.value = 'A senha é obrigatória para novos usuários.'
    return
  }

  try {
    if (editingUser.value) {
      const payload: any = { name: form.value.name, email: form.value.email, role: form.value.role }
      if (form.value.password) {
        payload.password = form.value.password
      }
      const updated = await updateUser(editingUser.value.id, payload)
      const idx = users.value.findIndex((u: any) => u.id === editingUser.value.id)
      if (idx !== -1) users.value[idx] = updated
    } else {
      const created = await createUser(form.value)
      users.value.push(created)
    }
    closeForm()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar usuário.'
  }
}

function confirmDelete(user: any) {
  deleting.value = user
  showDeleteConfirm.value = true
}

async function onDelete() {
  error.value = null
  try {
    if (deleting.value) {
      await deleteUser(deleting.value.id)
      users.value = users.value.filter((u: any) => u.id !== deleting.value.id)
    }
    showDeleteConfirm.value = false
    deleting.value = null
  } catch (e: any) {
    showDeleteConfirm.value = false
    deleting.value = null
    error.value = e?.data?.message || e?.message || 'Erro ao excluir usuário.'
  }
}
</script>

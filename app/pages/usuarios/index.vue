<template>
  <div class="max-w-[900px] mx-auto p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-3xl font-bold text-foreground">Usuários</h1>
      <BaseButton @click="openNew">Novo Usuário</BaseButton>
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
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="u in users" :key="u.id">
            <TableCell>{{ u.name }}</TableCell>
            <TableCell>{{ u.email }}</TableCell>
            <TableCell>
              <Badge :variant="roleBadgeVariant(u.role)">{{ u.role }}</Badge>
            </TableCell>
            <TableCell>
              <div class="flex gap-2">
                <BaseButton size="sm" variant="secondary" @click="openEdit(u)">Editar</BaseButton>
                <BaseButton size="sm" variant="danger" @click="confirmDelete(u)">Excluir</BaseButton>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <p v-else class="text-muted-foreground text-sm text-center py-10">Nenhum usuário cadastrado.</p>

    <!-- User form modal -->
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
        <div v-if="!editingUser" class="flex flex-col gap-1">
          <Label>Senha</Label>
          <Input v-model="form.password" type="password" required />
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

    <!-- Delete confirmation -->
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

const { getUsers, createUser, updateUser, deleteUser } = useUsers()

const users = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showForm = ref(false)
const editingUser = ref<any>(null)
const showDeleteConfirm = ref(false)
const deleting = ref<any>(null)

const form = ref({ name: '', email: '', password: '', role: 'USUARIO' })

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

function openNew() {
  editingUser.value = null
  form.value = { name: '', email: '', password: '', role: 'USUARIO' }
  showForm.value = true
}

function openEdit(user: any) {
  editingUser.value = user
  form.value = { name: user.name, email: user.email, password: '', role: user.role }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingUser.value = null
}

async function onSave() {
  error.value = null
  try {
    if (editingUser.value) {
      const payload: any = { name: form.value.name, email: form.value.email, role: form.value.role }
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

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-3xl font-bold text-foreground">Jogadores</h1>
      <BaseButton v-if="canCreate('players')" @click="openNew">Novo Jogador</BaseButton>
    </div>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div class="mb-4 max-w-[360px]">
      <SearchInput v-model="search" placeholder="Buscar jogador..." />
    </div>

    <PlayersPlayerTable :players="filtered" :loading="store.loading" :show-actions="canEdit('players')" @edit="openEdit" @delete="confirmDelete" />

    <PlayersPlayerForm :show="showForm" :player="editing" @save="onSave" @close="closeForm" />

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
const store = usePlayersStore()
const { canCreate, canEdit, canDelete } = usePermissions()
const search = ref('')
const showForm = ref(false)
const editing = ref<any>(null)
const showDeleteConfirm = ref(false)
const deleting = ref<any>(null)
const error = ref<string | null>(null)

const filtered = computed(() => {
  if (!search.value) return store.players
  const q = search.value.toLowerCase()
  return store.players.filter((p: any) =>
    p.name?.toLowerCase().includes(q) ||
    p.position?.toLowerCase().includes(q) ||
    p.type?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    await store.fetchPlayers()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar jogadores.'
  }
})

function openNew() {
  editing.value = null
  showForm.value = true
}

function openEdit(player: any) {
  editing.value = player
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editing.value = null
}

async function onSave(data: any) {
  error.value = null
  try {
    if (editing.value) {
      await store.updatePlayer(editing.value.id, data)
    } else {
      await store.createPlayer(data)
    }
    closeForm()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao salvar jogador.'
  }
}

function confirmDelete(player: any) {
  deleting.value = player
  showDeleteConfirm.value = true
}

async function onDelete() {
  error.value = null
  try {
    if (deleting.value) {
      await store.deletePlayer(deleting.value.id)
    }
    showDeleteConfirm.value = false
    deleting.value = null
  } catch (e: any) {
    showDeleteConfirm.value = false
    deleting.value = null
    error.value = e?.data?.message || e?.message || 'Erro ao excluir jogador.'
  }
}
</script>

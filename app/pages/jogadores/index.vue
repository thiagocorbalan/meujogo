<script setup lang="ts">
const groupsStore = useGroupsStore()
const { getMembers } = useGroups()
const search = ref('')
const error = ref<string | null>(null)
const players = ref<any[]>([])
const loading = ref(false)

const filtered = computed(() => {
  if (!search.value) return players.value
  const q = search.value.toLowerCase()
  return players.value.filter((p: any) =>
    p.name?.toLowerCase().includes(q) ||
    p.position?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  const groupId = groupsStore.activeGroupId
  if (!groupId) return
  loading.value = true
  try {
    const members = (await getMembers(groupId)) as any[]
    players.value = members
      .filter((m: any) => m.player)
      .map((m: any) => m.player)
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar jogadores.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-5">Jogadores</h1>

    <div v-if="error" class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-4">
      <p>{{ error }}</p>
    </div>

    <div class="mb-4 max-w-[360px]">
      <SearchInput v-model="search" placeholder="Buscar jogador..." />
    </div>

    <PlayersPlayerTable :players="filtered" :loading="loading" :show-actions="false" />
  </div>
</template>

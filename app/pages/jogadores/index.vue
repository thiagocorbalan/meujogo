<script setup lang="ts">
const store = usePlayersStore()
const search = ref('')
const error = ref<string | null>(null)

const filtered = computed(() => {
  if (!search.value) return store.players
  const q = search.value.toLowerCase()
  return store.players.filter((p: any) =>
    p.name?.toLowerCase().includes(q) ||
    p.position?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    await store.fetchPlayers()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar jogadores.'
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

    <PlayersPlayerTable :players="filtered" :loading="store.loading" :show-actions="false" />
  </div>
</template>

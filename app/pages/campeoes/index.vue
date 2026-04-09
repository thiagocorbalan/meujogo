<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'

const { getChampions } = useChampions()
const { baseURL } = useApi()

const champions = ref<any[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)

function resolvePhotoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  return `${baseURL}${url}`
}

onMounted(async () => {
  try {
    const data = await getChampions()
    champions.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erro ao carregar campeões:', e)
    errorMessage.value = 'Erro ao carregar campeões. Verifique sua conexão e tente novamente.'
  } finally {
    loading.value = false
  }
})

function formatDate(dateStr: string) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR')
}
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-6">
    <h1 class="text-3xl font-bold text-foreground mb-6">Campeões</h1>
<div v-if="errorMessage" class="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
      <span>{{ errorMessage }}</span>
      <button class="ml-3 text-red-600 hover:text-red-800 font-bold" @click="errorMessage = null">&times;</button>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <div v-else-if="champions.length" class="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] max-sm:grid-cols-1 gap-5">
      <Card v-for="c in champions" :key="c.id" class="overflow-hidden transition-shadow hover:shadow-lg">
        <div class="h-[180px] bg-muted flex items-center justify-center">
          <img v-if="c.photoUrl" :src="resolvePhotoUrl(c.photoUrl)" :alt="c.team?.name || 'Campeão'" class="w-full h-full object-cover" >
          <span v-else class="text-5xl">&#127942;</span>
        </div>
        <CardContent class="p-4">
          <h3 class="text-base font-bold text-foreground mb-1">{{ c.team?.name || 'Time Campeão' }}</h3>
          <p class="text-[13px] text-muted-foreground mb-2">{{ formatDate(c.createdAt) }}</p>
          <p v-if="c.team?.players?.length" class="text-[13px] text-foreground leading-relaxed">
            {{ c.team.players.map((tp: any) => tp.player?.name ?? tp.name).join(', ') }}
          </p>
        </CardContent>
      </Card>
    </div>

    <div v-else class="py-10 text-center bg-muted rounded-lg text-muted-foreground">
      <p>Nenhum campeão registrado ainda.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'

const { getChampions } = useChampions()
const { baseURL } = useApi()
const { canEdit } = usePermissions()

const champions = ref<any[]>([])
const loading = ref(true)
const errorMessage = ref<string | null>(null)
const editingChampionId = ref<number | null>(null)
const showEditModal = ref(false)

function resolvePhotoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (url.startsWith('http')) return url
  return `${baseURL}${url}`
}

async function fetchChampions() {
  try {
    const data = await getChampions()
    champions.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('Erro ao carregar campeões:', e)
    errorMessage.value = 'Erro ao carregar campeões. Verifique sua conexão e tente novamente.'
  } finally {
    loading.value = false
  }
}

function openEditPhoto(championId: number) {
  editingChampionId.value = championId
  showEditModal.value = true
}

async function onPhotoUploaded() {
  showEditModal.value = false
  editingChampionId.value = null
  await fetchChampions()
}

onMounted(fetchChampions)

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
          <div class="flex items-start justify-between mb-1">
            <h3 class="text-base font-bold text-foreground">{{ c.team?.name || 'Time Campeão' }}</h3>
            <BaseButton
              v-if="canEdit('champions')"
              variant="ghost"
              size="icon-sm"
              title="Editar foto"
              @click.stop="openEditPhoto(c.id)"
            >
              <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </BaseButton>
          </div>
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

    <ChampionsEditPhotoModal
      :show="showEditModal"
      :champion-id="editingChampionId"
      @close="showEditModal = false"
      @uploaded="onPhotoUploaded"
    />
  </div>
</template>

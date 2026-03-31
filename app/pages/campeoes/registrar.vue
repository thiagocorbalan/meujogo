<template>
  <div class="max-w-[800px] mx-auto py-8 px-4">
    <!-- Error banner -->
    <div v-if="errorMessage" class="mb-4 px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
      <span>{{ errorMessage }}</span>
      <button class="ml-3 text-red-600 hover:text-red-800 font-bold" @click="errorMessage = null">&times;</button>
    </div>

    <div v-if="loading" class="text-muted-foreground text-base py-10 text-center">Carregando...</div>

    <template v-else-if="champion">
      <!-- Celebration header -->
      <div class="text-center mb-8">
        <span class="text-6xl block mb-3">&#127942;</span>
        <h1 class="text-4xl font-extrabold text-foreground mb-2">Campeao!</h1>
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-lg font-bold" :style="{ background: champion.team?.color + '22', color: champion.team?.color, border: `2px solid ${champion.team?.color}` }">
          <span class="w-4 h-4 rounded-full" :style="{ background: champion.team?.color }"></span>
          {{ champion.team?.name || 'Time Campeao' }}
        </div>
      </div>

      <!-- Players -->
      <div v-if="teamPlayers.length" class="mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-3 text-center">Jogadores</h2>
        <div class="flex flex-wrap justify-center gap-3">
          <span
            v-for="p in teamPlayers"
            :key="p.id"
            class="px-3 py-1.5 bg-muted rounded-full text-sm font-medium text-foreground"
          >
            {{ p.name }}
          </span>
        </div>
      </div>

      <!-- Ranking -->
      <div v-if="ranking.length" class="mb-8">
        <h2 class="text-lg font-semibold text-foreground mb-3">Classificacao Final</h2>
        <RankingTable :ranking="ranking" :loading="false" />
      </div>

      <!-- Photo upload -->
      <div class="mb-8 bg-white border rounded-lg p-6">
        <h2 class="text-lg font-semibold text-foreground mb-3">Foto do Campeao</h2>

        <div v-if="canCreate('champions') && !photoFile && !champion.photoUrl" class="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" @click="triggerFileInput" @dragover.prevent @drop.prevent="onDrop">
          <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFileSelect" />
          <p class="text-muted-foreground text-sm mb-1">Arraste uma imagem ou clique para selecionar</p>
          <p class="text-muted-foreground text-xs">JPG, PNG ou WebP (max 5MB)</p>
        </div>

        <div v-if="photoPreview" class="mt-4">
          <img :src="photoPreview" alt="Preview" class="max-h-[240px] rounded-lg mx-auto object-cover" />
          <div v-if="canCreate('champions')" class="flex justify-center mt-3 gap-2">
            <BaseButton variant="secondary" size="sm" @click="clearPhoto">Trocar</BaseButton>
          </div>
        </div>

        <div v-else-if="champion.photoUrl" class="mt-4">
          <img :src="resolvePhotoUrl(champion.photoUrl)" alt="Foto do campeao" class="max-h-[240px] rounded-lg mx-auto object-cover" />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-center gap-4">
        <BaseButton v-if="canCreate('champions')" variant="primary" size="md" :loading="saving" :disabled="!photoFile" @click="handleSave">
          Salvar Foto e Finalizar
        </BaseButton>
        <BaseButton variant="secondary" size="md" @click="navigateTo('/campeoes')">
          {{ photoFile ? 'Pular' : 'Ir para Galeria' }}
        </BaseButton>
      </div>
    </template>

    <div v-else class="py-10 text-center bg-muted rounded-lg text-muted-foreground">
      <p>Nenhum campeao encontrado para esta sessao.</p>
      <NuxtLink to="/campeoes">
        <BaseButton variant="secondary" size="md" class="mt-3">Ver Galeria de Campeoes</BaseButton>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { canCreate } = usePermissions()
const route = useRoute()
const { getSessionChampion, uploadChampionPhoto } = useChampions()
const { getSessionRanking } = useRanking()
const { baseURL } = useApi()

function resolvePhotoUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${baseURL}${url}`
}

const sessionId = computed(() => {
  const val = route.query.sessionId
  return val ? Number(val) : null
})

const champion = ref<any>(null)
const ranking = ref<any[]>([])
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref<string | null>(null)
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const teamPlayers = computed(() => {
  if (!champion.value?.team?.players) return []
  return champion.value.team.players.map((tp: any) => ({
    id: tp.player?.id ?? tp.id,
    name: tp.player?.name ?? tp.name,
  }))
})

onMounted(async () => {
  if (!sessionId.value) {
    loading.value = false
    return
  }
  try {
    const [champ, rank] = await Promise.all([
      getSessionChampion(sessionId.value),
      getSessionRanking(sessionId.value).catch(() => []),
    ])
    champion.value = champ
    ranking.value = Array.isArray(rank) ? rank : []
  } catch (e) {
    console.error('Erro ao carregar campeao:', e)
    errorMessage.value = 'Erro ao carregar dados do campeao.'
  } finally {
    loading.value = false
  }
})

function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) setPhoto(input.files[0])
}

function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) setPhoto(file)
}

function setPhoto(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = 'Arquivo muito grande. Maximo 5MB.'
    return
  }
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    errorMessage.value = 'Formato invalido. Use JPG, PNG ou WebP.'
    return
  }
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

function clearPhoto() {
  photoFile.value = null
  if (photoPreview.value) {
    URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = null
  }
}

async function handleSave() {
  if (!photoFile.value || !champion.value?.id) return
  saving.value = true
  errorMessage.value = null
  try {
    await uploadChampionPhoto(champion.value.id, photoFile.value)
    navigateTo('/campeoes')
  } catch (e) {
    console.error('Erro ao salvar foto:', e)
    errorMessage.value = 'Erro ao salvar foto do campeao. Tente novamente.'
  } finally {
    saving.value = false
  }
}
</script>

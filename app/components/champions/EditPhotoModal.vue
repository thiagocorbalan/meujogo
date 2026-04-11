<script setup lang="ts">
const props = defineProps<{
  show: boolean
  championId: number | null
}>()

const emit = defineEmits<{
  close: []
  uploaded: []
}>()

const { uploadChampionPhoto } = useChampions()

const uploading = ref(false)
const errorMessage = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

function onFileSelected(file: File) {
  selectedFile.value = file
  errorMessage.value = null
}

async function handleSave() {
  if (!selectedFile.value || !props.championId) return
  uploading.value = true
  errorMessage.value = null
  try {
    await uploadChampionPhoto(props.championId, selectedFile.value)
    emit('uploaded')
    emit('close')
  } catch (e: any) {
    const status = e?.status || e?.data?.statusCode
    if (status === 403) {
      errorMessage.value = 'Sessão expirada. Recarregue a página e tente novamente.'
    } else if (status === 413 || e?.data?.message?.includes('size')) {
      errorMessage.value = 'Arquivo muito grande. Tamanho máximo: 5MB.'
    } else {
      errorMessage.value = 'Erro ao salvar foto. Tente novamente.'
    }
  } finally {
    uploading.value = false
  }
}

function handleClose() {
  selectedFile.value = null
  errorMessage.value = null
  emit('close')
}
</script>

<template>
  <BaseModal :show="show" title="Editar Foto do Campeao" @close="handleClose">
    <PhotoUpload :loading="uploading" @upload="onFileSelected" />

    <p v-if="errorMessage" class="mt-3 text-sm text-destructive">{{ errorMessage }}</p>

    <template #footer>
      <BaseButton variant="secondary" @click="handleClose">Cancelar</BaseButton>
      <BaseButton :loading="uploading" :disabled="!selectedFile" @click="handleSave">Salvar Foto</BaseButton>
    </template>
  </BaseModal>
</template>

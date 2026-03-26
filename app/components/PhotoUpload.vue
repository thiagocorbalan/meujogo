<template>
  <div
    class="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors"
    :class="[
      isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50',
      loading ? 'pointer-events-none opacity-60' : 'cursor-pointer',
    ]"
    @click="openFilePicker"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="onDrop"
  >
    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="onFileSelected"
    />

    <template v-if="loading">
      <svg class="h-8 w-8 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <p class="mt-2 text-sm text-muted-foreground">Enviando...</p>
    </template>

    <template v-else-if="previewUrl">
      <img :src="previewUrl" alt="Preview" class="max-h-48 max-w-full rounded object-contain" />
      <p class="mt-2 text-sm text-muted-foreground">Clique ou arraste para trocar a foto</p>
    </template>

    <template v-else>
      <svg class="h-10 w-10 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
      <p class="mt-2 text-sm font-medium">Clique ou arraste uma foto aqui</p>
      <p class="mt-1 text-xs text-muted-foreground">JPG, PNG ou WebP (max 5MB)</p>
    </template>

    <p v-if="error" class="mt-2 text-sm text-destructive">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

defineProps<{
  loading?: boolean
}>()

const emit = defineEmits<{
  upload: [file: File]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const previewUrl = ref<string | null>(null)
const error = ref<string | null>(null)

function openFilePicker() {
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.[0]) {
    handleFile(input.files[0])
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) {
    handleFile(file)
  }
}

function handleFile(file: File) {
  error.value = null

  if (!ALLOWED_TYPES.includes(file.type)) {
    error.value = 'Formato invalido. Use JPG, PNG ou WebP.'
    return
  }

  if (file.size > MAX_SIZE) {
    error.value = 'Arquivo muito grande. Tamanho maximo: 5MB.'
    return
  }

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
  emit('upload', file)
}
</script>

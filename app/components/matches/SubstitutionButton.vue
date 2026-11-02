<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  availableCount: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  open: []
}>()

const isDisabled = computed(() => props.disabled || props.availableCount === 0)

const tooltip = computed(() =>
  props.availableCount === 0
    ? 'Nenhum jogador disponivel para substituicao'
    : `${props.availableCount} jogador(es) disponivel(is) para entrar`,
)

function handleClick() {
  if (isDisabled.value) return
  emit('open')
}
</script>

<template>
  <button
    type="button"
    :disabled="isDisabled"
    :title="tooltip"
    :aria-label="tooltip"
    class="relative w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
    @click="handleClick"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M16 3h5v5" />
      <path d="M4 20L21 3" />
      <path d="M21 16v5h-5" />
      <path d="M15 15l6 6" />
      <path d="M4 4l5 5" />
    </svg>
    <span>Substituir jogador</span>
    <span
      v-if="availableCount > 0"
      data-testid="sub-available-count"
      class="ml-1 rounded-full bg-indigo-600 text-white text-xs font-bold px-2 py-0.5"
    >
      {{ availableCount }}
    </span>
  </button>
</template>

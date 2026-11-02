<script setup lang="ts">
interface LastFinishedMatch {
  id: number
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
}

const props = defineProps<{
  lastFinishedMatch: LastFinishedMatch | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'open-late-goal': [matchId: number]
}>()

function handleClick() {
  if (props.disabled || !props.lastFinishedMatch) return
  emit('open-late-goal', props.lastFinishedMatch.id)
}
</script>

<template>
  <button
    v-if="lastFinishedMatch"
    type="button"
    :disabled="disabled"
    class="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed transition"
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
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
    <span>Adicionar gol esquecido</span>
    <span class="sr-only">
      na ultima partida {{ lastFinishedMatch.teamAName }} {{ lastFinishedMatch.scoreA }} x
      {{ lastFinishedMatch.scoreB }} {{ lastFinishedMatch.teamBName }}
    </span>
  </button>
</template>

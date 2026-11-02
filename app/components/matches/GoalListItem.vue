<script setup lang="ts">
import { computed } from 'vue'
import { formatMatchTime } from '~/utils/matchTime'

export interface GoalDisplay {
  id: number
  playerName: string | null
  teamName: string
  teamColor: string
  minute: number | null
  source: 'LIVE' | 'LATE'
}

const props = defineProps<{
  goal: GoalDisplay
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'undo', goal: GoalDisplay): void
}>()

const label = computed(() => {
  if (props.goal.source === 'LATE' || !props.goal.playerName) {
    return 'Gol tardio'
  }
  return props.goal.playerName
})

const minuteLabel = computed(() => formatMatchTime(props.goal.minute))

const ariaLabel = computed(() => {
  const parts: string[] = ['Desfazer gol']
  if (props.goal.playerName) parts.push(`de ${props.goal.playerName}`)
  else parts.push('tardio')
  parts.push(`do ${props.goal.teamName}`)
  if (props.goal.minute !== null && props.goal.minute !== undefined) {
    parts.push(`aos ${minuteLabel.value}`)
  }
  return parts.join(' ')
})

function handleClick() {
  if (props.disabled) return
  emit('undo', props.goal)
}
</script>

<template>
  <li
    class="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-slate-200"
  >
    <span
      class="inline-block w-3 h-3 rounded-full shrink-0"
      :style="{ backgroundColor: goal.teamColor }"
      :aria-hidden="true"
    />
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-slate-900 truncate">
        {{ label }}
      </p>
      <p class="text-xs text-slate-500 truncate">
        {{ goal.teamName }}<span v-if="minuteLabel"> · {{ minuteLabel }}</span>
      </p>
    </div>
    <button
      type="button"
      class="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @click="handleClick"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 6h18" />
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      </svg>
    </button>
  </li>
</template>

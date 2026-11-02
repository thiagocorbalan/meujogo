<script setup lang="ts">
import { formatMatchTime } from '~/utils/matchTime'

interface GoalRow {
  id: number
  playerName: string | null
  teamName: string
  source: 'LIVE' | 'LATE'
  minute: number | null
}

interface ReviewMatch {
  id: number
  matchOrder: number
  teamAName: string
  teamBName: string
  scoreA: number
  scoreB: number
  goals: GoalRow[]
}

const props = defineProps<{
  match: ReviewMatch
  disabled?: boolean
}>()

const emit = defineEmits<{
  'add-late-goal': [matchId: number]
}>()

function handleAdd() {
  if (props.disabled) return
  emit('add-late-goal', props.match.id)
}
</script>

<template>
  <article class="rounded-lg border bg-white p-4 space-y-3">
    <header class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Partida {{ match.matchOrder }}
        </span>
        <div class="flex items-center gap-2 text-base font-semibold text-foreground truncate">
          <span class="truncate">{{ match.teamAName }}</span>
          <span class="font-mono tabular-nums">{{ match.scoreA }}</span>
          <span class="text-muted-foreground">x</span>
          <span class="font-mono tabular-nums">{{ match.scoreB }}</span>
          <span class="truncate">{{ match.teamBName }}</span>
        </div>
      </div>
      <button
        type="button"
        data-testid="add-late-goal"
        :disabled="disabled"
        class="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60 disabled:cursor-not-allowed"
        aria-label="Adicionar gol tardio a esta partida"
        @click="handleAdd"
      >
        + Gol tardio
      </button>
    </header>

    <ul v-if="match.goals.length > 0" class="space-y-1 text-sm">
      <li
        v-for="g in match.goals"
        :key="g.id"
        class="flex items-center gap-2 text-foreground"
      >
        <span class="font-medium truncate">
          {{ g.playerName ?? 'Gol tardio' }}
        </span>
        <span class="text-muted-foreground">·</span>
        <span class="text-muted-foreground truncate">{{ g.teamName }}</span>
        <span v-if="g.minute !== null" class="text-muted-foreground">({{ formatMatchTime(g.minute) }})</span>
        <span
          v-if="g.source === 'LATE'"
          class="ml-auto text-xs font-semibold text-amber-800 bg-amber-100 rounded px-2 py-0.5"
        >
          Gol tardio
        </span>
      </li>
    </ul>
    <p v-else class="text-sm text-muted-foreground">Nenhum gol registrado.</p>
  </article>
</template>

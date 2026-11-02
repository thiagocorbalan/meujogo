<script setup lang="ts">
import { useId } from 'vue'

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

defineProps<{
  matches: ReviewMatch[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  'add-late-goal': [matchId: number]
  close: []
}>()

const titleId = useId()

function handleAddLateGoal(matchId: number) {
  emit('add-late-goal', matchId)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
  >
    <div
      class="w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
    >
      <header class="flex items-center justify-between p-4 border-b">
        <h2 :id="titleId" class="text-lg font-semibold m-0">
          Revisar resultados da sessao
        </h2>
        <button
          type="button"
          data-testid="review-close"
          class="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded hover:bg-gray-100"
          aria-label="Fechar revisao"
          @click="handleClose"
        >
          <span aria-hidden="true" class="text-2xl leading-none">&times;</span>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-4 space-y-3">
        <p v-if="matches.length === 0" class="text-sm text-muted-foreground">
          Nenhuma partida registrada nesta sessao.
        </p>
        <MatchesSessionReviewItem
          v-for="m in matches"
          :key="m.id"
          :match="m"
          :disabled="disabled"
          @add-late-goal="handleAddLateGoal"
        />
      </div>
    </div>
  </div>
</template>

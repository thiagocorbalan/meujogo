<script setup lang="ts">
import { useCountdownTimer } from '~/composables/useCountdownTimer'

const props = defineProps<{
  match: any
  teams: any[]
  loading: boolean
  disabled: boolean
  twoTeamMode: boolean
  sessionStartedAt?: string | null
  sessionDurationMinutes?: number
}>()

const emit = defineEmits<{
  goal: [playerId: number, teamId: number]
  'undo-goal': [goal: { id: number; playerName: string; teamName: string; minute?: number }]
  'end-match': []
  'end-session': []
}>()

function getMatchStartTimestamp(match: any): string | null {
  if (!match?.events?.length) return null
  const startEvent = match.events.find((e: any) => e.type === 'MATCH_STARTED')
  return startEvent?.timestamp ?? startEvent?.createdAt ?? null
}

// In 2-team mode, timer tracks session duration; in rotation mode, per-match duration
const durationSeconds = computed(() => {
  if (props.twoTeamMode && props.sessionDurationMinutes) {
    return props.sessionDurationMinutes * 60
  }
  return (props.match?.session?.matchDurationMinutes ?? 10) * 60
})

const startTimestamp = computed(() => {
  if (props.twoTeamMode && props.sessionStartedAt) {
    return props.sessionStartedAt
  }
  return getMatchStartTimestamp(props.match)
})

const { display: timerDisplay, isTimeUp, isOvertime, remainingSeconds } = useCountdownTimer(durationSeconds, startTimestamp)

const currentMinute = computed(() => {
  const elapsed = durationSeconds.value - remainingSeconds.value
  return Math.floor(elapsed / 60) + 1
})

function handleGoal(playerId: number, teamId: number) {
  emit('goal', playerId, teamId)
}

// In 2-team mode, the end-match button is always enabled (no time gate)
const canEndMatch = computed(() => props.twoTeamMode || isTimeUp.value)

defineExpose({ currentMinute })
</script>

<template>
  <div>
    <div class="flex items-center justify-center gap-4 mb-4 py-3 px-5 bg-white border rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {{ twoTeamMode ? 'Sessão' : 'Tempo' }}
        </span>
        <span
          :class="[
            'font-mono text-3xl font-bold tabular-nums',
            isTimeUp ? 'text-red-600 animate-pulse' : 'text-foreground',
          ]"
        >
          {{ timerDisplay }}
        </span>
      </div>
      <span v-if="isTimeUp" class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
        Tempo esgotado
      </span>
    </div>

    <MatchesMatchBoard
      :match="match"
      :teams="teams"
      :disabled="loading || disabled"
      @goal="handleGoal"
      @undo-goal="$emit('undo-goal', $event)"
    />

    <div v-if="!disabled" class="flex justify-end mt-4">
      <BaseButton
        v-if="twoTeamMode"
        variant="danger"
        size="md"
        :loading="loading"
        @click="$emit('end-session')"
      >
        Encerrar Sessão
      </BaseButton>
      <BaseButton
        v-else
        variant="danger"
        size="md"
        :loading="loading"
        :disabled="!canEndMatch"
        :title="canEndMatch ? 'Encerrar partida' : 'Aguarde o tempo regulamentar encerrar'"
        @click="$emit('end-match')"
      >
        Encerrar Partida
      </BaseButton>
    </div>

    <div class="mt-2 bg-white border rounded-lg p-4">
      <h3 class="text-base font-semibold text-foreground mb-2.5 mt-0">Eventos</h3>
      <MatchesMatchTimeline :events="match.events ?? []" :teams="teams" />
    </div>
  </div>
</template>

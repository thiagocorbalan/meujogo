<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCountdownTimer } from '~/composables/useCountdownTimer'
import type { GoalDisplay } from './GoalListItem.vue'

interface MatchEventLike {
  type: string
  timestamp?: string
  createdAt?: string
}

interface GoalLike {
  id: number
  playerId: number | null
  teamId: number
  minute: number | null
  source?: 'LIVE' | 'LATE'
}

interface MatchPlayerLike {
  playerId?: number
  player?: { id: number; name: string }
}

interface MatchLike {
  events?: MatchEventLike[]
  goals?: GoalLike[]
  session?: { matchDurationMinutes?: number }
  teamA?: { id: number; name: string; color?: string; players?: unknown[] }
  teamB?: { id: number; name: string; color?: string; players?: unknown[] }
  matchPlayers?: MatchPlayerLike[]
}

interface TeamLike {
  id: number
  name: string
  color?: string
  players?: Array<{ id?: number; name?: string; player?: { id: number; name: string } }>
}

const props = defineProps<{
  match: MatchLike
  teams: TeamLike[]
  loading: boolean
  disabled: boolean
  twoTeamMode: boolean
  sessionStartedAt?: string | null
  sessionDurationMinutes?: number
}>()

const emit = defineEmits<{
  goal: [playerId: number, teamId: number]
  'undo-goal': [goal: GoalDisplay]
  'end-match': []
  'end-session': []
}>()

function getMatchStartTimestamp(match: MatchLike | undefined): string | null {
  if (!match?.events?.length) return null
  const startEvent = match.events.find((e) => e.type === 'MATCH_STARTED')
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

const { display: timerDisplay, isTimeUp, remainingSeconds } = useCountdownTimer(durationSeconds, startTimestamp)

const elapsedSeconds = computed(() =>
  Math.max(0, durationSeconds.value - remainingSeconds.value),
)
const currentMinute = computed(() => Math.floor(elapsedSeconds.value / 60) + 1)

function handleGoal(playerId: number, teamId: number) {
  emit('goal', playerId, teamId)
}

const canEndMatch = computed(() => props.twoTeamMode || isTimeUp.value)

const showGoalList = ref(false)

function normalizeTeamPlayers(team: TeamLike | undefined) {
  if (!team?.players) return []
  return team.players.map((p) => {
    if (p.player && typeof p.player === 'object') {
      return { id: p.player.id, name: p.player.name }
    }
    return { id: p.id ?? 0, name: p.name ?? '' }
  })
}

function resolveTeam(teamId: number): TeamLike | undefined {
  return props.teams.find((t) => t.id === teamId)
}

const displayGoals = computed<GoalDisplay[]>(() => {
  const goals = props.match.goals ?? []
  const allPlayers = [
    ...normalizeTeamPlayers(resolveTeam(props.match.teamA?.id ?? 0)),
    ...normalizeTeamPlayers(resolveTeam(props.match.teamB?.id ?? 0)),
  ]
  return goals.map((g) => {
    const team = resolveTeam(g.teamId)
    const player = g.playerId !== null ? allPlayers.find((p) => p.id === g.playerId) : null
    return {
      id: g.id,
      playerName: player?.name ?? null,
      teamName: team?.name ?? 'Time',
      teamColor: team?.color ?? '#3b82f6',
      minute: g.minute,
      source: g.source ?? 'LIVE',
    }
  })
})

function handleOpenGoalList() {
  showGoalList.value = true
}

function handleCloseGoalList() {
  showGoalList.value = false
}

function handleUndoGoalFromList(goal: GoalDisplay) {
  emit('undo-goal', goal)
}

defineExpose({ currentMinute, elapsedSeconds, isTimeUp })
</script>

<template>
  <div>
    <div class="flex items-center justify-center gap-4 mb-4 py-3 px-5 bg-white border rounded-lg">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {{ twoTeamMode ? 'Sessão' : 'Tempo' }}
        </span>
        <span
          role="timer"
          :aria-label="`${twoTeamMode ? 'Tempo de sessao' : 'Tempo de partida'}: ${timerDisplay}`"
          :class="[
            'font-mono text-3xl font-bold tabular-nums motion-reduce:animate-none',
            isTimeUp ? 'text-red-600 animate-pulse' : 'text-foreground',
          ]"
        >
          {{ timerDisplay }}
        </span>
      </div>
      <span
        v-if="isTimeUp"
        role="status"
        aria-live="assertive"
        class="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded"
      >
        Tempo esgotado
      </span>
    </div>

    <MatchesMatchBoard
      :match="match"
      :teams="teams"
      :disabled="loading || disabled"
      @goal="handleGoal"
      @open-goal-list="handleOpenGoalList"
    />

    <MatchesGoalList
      v-if="showGoalList"
      :goals="displayGoals"
      :disabled="loading || disabled"
      @close="handleCloseGoalList"
      @undo-goal="handleUndoGoalFromList"
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
      <MatchesMatchTimeline
        :events="match.events ?? []"
        :teams="teams"
        :match-players="match.matchPlayers ?? []"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Match, Team, Player } from '~/types/match'

interface TeamPlayerRef {
  id?: number
  name?: string
  player?: { id: number; name: string }
}

interface TeamLike {
  id: number
  name: string
  color?: string
  players?: TeamPlayerRef[]
}

const props = defineProps<{
  match: Partial<Match> & {
    teamA?: TeamLike
    teamB?: TeamLike
  }
  teams?: TeamLike[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'goal', playerId: number, teamId: number): void
  (e: 'open-goal-list'): void
}>()

function resolveTeam(teamRef: TeamLike | undefined): TeamLike | null {
  if (!teamRef) return null
  if (props.teams && props.teams.length) {
    return props.teams.find((t) => t.id === teamRef.id) ?? teamRef
  }
  return teamRef
}

const teamAResolved = computed(() => resolveTeam(props.match.teamA))
const teamBResolved = computed(() => resolveTeam(props.match.teamB))

const teamAColor = computed(() => teamAResolved.value?.color ?? '#3b82f6')
const teamBColor = computed(() => teamBResolved.value?.color ?? '#ef4444')

function normalizePlayers(rawPlayers: TeamPlayerRef[] | undefined): Pick<Player, 'id' | 'name'>[] {
  if (!rawPlayers || !rawPlayers.length) return []
  return rawPlayers.map((p) => {
    if (p.player && typeof p.player === 'object') {
      return { id: p.player.id, name: p.player.name }
    }
    return { id: p.id ?? 0, name: p.name ?? '' }
  })
}

const playersA = computed(() => normalizePlayers(teamAResolved.value?.players))
const playersB = computed(() => normalizePlayers(teamBResolved.value?.players))

const goalCount = computed(() => props.match.goals?.length ?? 0)

function handleOpenGoalList() {
  if (props.disabled) return
  emit('open-goal-list')
}
</script>

<template>
  <div class="bg-white rounded-xl shadow-md overflow-hidden">
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 py-5 bg-slate-800 text-white">
      <div class="flex items-center gap-2">
        <span
          role="img"
          :aria-label="`Cor do time ${teamAResolved?.name ?? 'A'}`"
          class="inline-block w-3.5 h-3.5 rounded-full shrink-0"
          :style="{ backgroundColor: teamAColor }"
        />
        <span class="text-base font-semibold">{{ teamAResolved?.name ?? match.teamA?.name ?? 'Time A' }}</span>
      </div>
      <div class="flex flex-col items-center">
        <div class="text-4xl font-extrabold tracking-wider flex items-center gap-2.5 text-slate-100">
          {{ match.scoreA ?? 0 }} <span class="text-2xl font-normal text-slate-400">&times;</span> {{ match.scoreB ?? 0 }}
        </div>
        <button
          v-if="goalCount > 0 && !disabled"
          type="button"
          class="mt-2 min-h-[44px] px-3 text-xs font-semibold text-slate-200 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-md transition-colors"
          :aria-label="`Ver lista de ${goalCount} gols`"
          @click.stop="handleOpenGoalList"
        >
          Ver gols ({{ goalCount }})
        </button>
      </div>
      <div class="flex items-center gap-2 justify-end">
        <span class="text-base font-semibold">{{ teamBResolved?.name ?? match.teamB?.name ?? 'Time B' }}</span>
        <span
          role="img"
          :aria-label="`Cor do time ${teamBResolved?.name ?? 'B'}`"
          class="inline-block w-3.5 h-3.5 rounded-full shrink-0"
          :style="{ backgroundColor: teamBColor }"
        />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-px bg-border">
      <div class="bg-white p-4 flex flex-col gap-1.5">
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jogadores</p>
        <MatchesGoalButton
          v-for="player in playersA"
          :key="player.id"
          :player="player"
          :team-id="teamAResolved?.id ?? match.teamA?.id ?? 0"
          :disabled="disabled"
          @goal="(pid: number, tid: number) => emit('goal', pid, tid)"
        />
        <p v-if="!playersA.length" class="text-sm text-muted-foreground italic">Nenhum jogador</p>
      </div>
      <div class="bg-white p-4 flex flex-col gap-1.5">
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jogadores</p>
        <MatchesGoalButton
          v-for="player in playersB"
          :key="player.id"
          :player="player"
          :team-id="teamBResolved?.id ?? match.teamB?.id ?? 0"
          :disabled="disabled"
          @goal="(pid: number, tid: number) => emit('goal', pid, tid)"
        />
        <p v-if="!playersB.length" class="text-sm text-muted-foreground italic">Nenhum jogador</p>
      </div>
    </div>
  </div>
</template>

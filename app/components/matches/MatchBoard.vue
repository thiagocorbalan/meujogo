<template>
  <div class="bg-white rounded-xl shadow-md overflow-hidden">
    <!-- Score row -->
    <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-6 py-5 bg-slate-800 text-white">
      <div class="flex items-center gap-2">
        <span class="inline-block w-3.5 h-3.5 rounded-full shrink-0" :style="{ backgroundColor: teamAColor }" />
        <span class="text-base font-semibold">{{ teamAResolved?.name ?? match.teamA?.name ?? 'Time A' }}</span>
      </div>
      <div class="text-4xl font-extrabold tracking-wider flex items-center gap-2.5 text-slate-100">
        {{ match.scoreA ?? 0 }} <span class="text-2xl font-normal text-slate-400">&times;</span> {{ match.scoreB ?? 0 }}
      </div>
      <div class="flex items-center gap-2 justify-end">
        <span class="text-base font-semibold">{{ teamBResolved?.name ?? match.teamB?.name ?? 'Time B' }}</span>
        <span class="inline-block w-3.5 h-3.5 rounded-full shrink-0" :style="{ backgroundColor: teamBColor }" />
      </div>
    </div>

    <!-- Players / goal buttons -->
    <div class="grid grid-cols-2 gap-px bg-border">
      <div class="bg-white p-4 flex flex-col gap-1.5">
        <p class="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Jogadores</p>
        <MatchesGoalButton
          v-for="player in playersA"
          :key="player.id"
          :player="player"
          :team-id="teamAResolved?.id ?? match.teamA?.id"
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
          :team-id="teamBResolved?.id ?? match.teamB?.id"
          :disabled="disabled"
          @goal="(pid: number, tid: number) => emit('goal', pid, tid)"
        />
        <p v-if="!playersB.length" class="text-sm text-muted-foreground italic">Nenhum jogador</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  match: {
    teamA?: { id: number; name: string; color?: string; players?: any[] }
    teamB?: { id: number; name: string; color?: string; players?: any[] }
    scoreA?: number
    scoreB?: number
    goals?: any[]
    events?: any[]
  }
  teams?: any[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'goal', playerId: number, teamId: number): void
}>()

function resolveTeam(teamRef: any) {
  if (!teamRef) return null
  if (props.teams && props.teams.length) {
    return props.teams.find((t) => t.id === (teamRef?.id ?? teamRef)) ?? teamRef
  }
  return teamRef
}

const teamAResolved = computed(() => resolveTeam(props.match.teamA))
const teamBResolved = computed(() => resolveTeam(props.match.teamB))

const teamAColor = computed(() => teamAResolved.value?.color ?? '#3b82f6')
const teamBColor = computed(() => teamBResolved.value?.color ?? '#ef4444')

function normalizePlayers(rawPlayers: any[]): { id: number; name: string }[] {
  if (!rawPlayers || !rawPlayers.length) return []
  return rawPlayers.map((p: any) => {
    // Handle nested TeamPlayer format: { id, teamId, playerId, player: { id, name, ... } }
    if (p.player && typeof p.player === 'object') {
      return { id: p.player.id, name: p.player.name }
    }
    // Already flat format: { id, name }
    return { id: p.id, name: p.name }
  })
}

const playersA = computed(() => normalizePlayers(teamAResolved.value?.players ?? []))
const playersB = computed(() => normalizePlayers(teamBResolved.value?.players ?? []))
</script>

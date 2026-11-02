<script setup lang="ts">
import { computed } from 'vue'
import { formatMatchTime } from '~/utils/matchTime'

interface TimelineEvent {
  type: string
  timestamp: string
  payload?: Record<string, any>
}

interface TimelineMatchPlayer {
  playerId?: number
  player?: { id: number; name: string }
}

const props = defineProps<{
  events: TimelineEvent[]
  teams?: any[]
  matchPlayers?: TimelineMatchPlayer[]
}>()

const sortedEvents = computed(() =>
  [...(props.events ?? [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  ),
)

function iconFor(type: string): string {
  if (type === 'GOAL_SCORED') return '\u26BD'
  if (type === 'MATCH_STARTED') return '\uD83D\uDFE2'
  if (type === 'MATCH_ENDED') return '\uD83D\uDD34'
  if (type === 'PLAYER_SUBSTITUTED') return '\uD83D\uDD04'
  if (type === 'SUBSTITUTION_REVERTED') return '\u21A9\uFE0F'
  if (type === 'LATE_GOAL_ADDED') return '\u26BD'
  if (type === 'LATE_GOAL_REMOVED') return '\u274C'
  return '\u2022'
}

function resolvePlayerName(playerId: number | undefined): string {
  if (playerId == null) return ''
  if (props.matchPlayers?.length) {
    for (const mp of props.matchPlayers) {
      const pid = mp.player?.id ?? mp.playerId
      if (pid === playerId && mp.player?.name) return mp.player.name
    }
  }
  if (!props.teams?.length) return ''
  for (const team of props.teams) {
    if (!team.players) continue
    for (const tp of team.players) {
      const pid = tp.player?.id ?? tp.id
      const pname = tp.player?.name ?? tp.name
      if (pid === playerId) return pname
    }
  }
  return ''
}

function resolveTeamName(teamId: number | undefined): string {
  if (teamId == null || !props.teams?.length) return ''
  const team = props.teams.find((t) => t.id === teamId)
  return team?.name ?? ''
}

function reasonLabel(reason: string | undefined): string {
  if (reason === 'LESAO') return 'Lesão'
  if (reason === 'CANSACO') return 'Cansaço'
  if (reason === 'SEM_MOTIVO') return 'sem motivo'
  return ''
}

function labelFor(event: TimelineEvent): string {
  if (event.type === 'GOAL_SCORED') {
    const name = event.payload?.playerName || resolvePlayerName(event.payload?.playerId) || 'Jogador desconhecido'
    const formatted = formatMatchTime(event.payload?.minute)
    const minute = formatted ? ` - ${formatted}` : ''
    return `Gol de ${name}${minute}`
  }
  if (event.type === 'MATCH_STARTED') return 'Partida iniciada'
  if (event.type === 'MATCH_ENDED') return 'Partida encerrada'
  if (event.type === 'PLAYER_SUBSTITUTED') {
    const teamName = resolveTeamName(event.payload?.teamId)
    const outName = resolvePlayerName(event.payload?.playerOutId) || 'Jogador'
    const inName = resolvePlayerName(event.payload?.playerInId) || 'Jogador'
    const reason = reasonLabel(event.payload?.reason)
    const formatted = formatMatchTime(event.payload?.minute)
    const minute = formatted ? ` - ${formatted}` : ''
    const teamSuffix = teamName ? ` no ${teamName}` : ''
    const reasonSuffix = reason ? ` por ${reason}` : ''
    return `Substituição${teamSuffix} - \u2B07\uFE0E ${outName} \u2B06\uFE0E ${inName}${reasonSuffix}${minute}`
  }
  if (event.type === 'SUBSTITUTION_REVERTED') {
    const teamName = resolveTeamName(event.payload?.teamId)
    const teamSuffix = teamName ? ` no ${teamName}` : ''
    return `Substituição desfeita${teamSuffix}`
  }
  if (event.type === 'LATE_GOAL_ADDED') {
    const teamName = resolveTeamName(event.payload?.teamId)
    return `Gol tardio ${teamName ? `(${teamName})` : ''}`.trim()
  }
  if (event.type === 'LATE_GOAL_REMOVED') return 'Gol tardio removido'
  return event.type
}

function formatTime(ts: string): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="max-h-80 overflow-y-auto py-1">
    <p v-if="!events || events.length === 0" class="text-center text-muted-foreground text-sm py-4">
      Nenhum evento registrado.
    </p>
    <ul v-else class="list-none m-0 p-0 flex flex-col gap-1.5">
      <li
        v-for="(event, index) in sortedEvents"
        :key="index"
        :class="[
          'flex items-center gap-2 px-3 py-2 rounded-md text-sm text-foreground',
          event.type === 'GOAL_SCORED' ? 'bg-green-50' : '',
          event.type === 'MATCH_STARTED' ? 'bg-green-50' : '',
          event.type === 'MATCH_ENDED' ? 'bg-red-50' : '',
          !['GOAL_SCORED', 'MATCH_STARTED', 'MATCH_ENDED'].includes(event.type) ? 'bg-muted' : '',
        ]"
      >
        <span aria-hidden="true" class="text-base shrink-0">{{ iconFor(event.type) }}</span>
        <span class="flex-1">{{ labelFor(event) }}</span>
        <span class="text-xs text-muted-foreground whitespace-nowrap shrink-0">{{ formatTime(event.timestamp) }}</span>
      </li>
    </ul>
  </div>
</template>

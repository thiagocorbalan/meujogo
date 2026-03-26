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
        <span class="text-base shrink-0">{{ iconFor(event.type) }}</span>
        <span class="flex-1">{{ labelFor(event) }}</span>
        <span class="text-xs text-muted-foreground whitespace-nowrap shrink-0">{{ formatTime(event.timestamp) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface TimelineEvent {
  type: string
  timestamp: string
  payload?: Record<string, any>
}

const props = defineProps<{
  events: TimelineEvent[]
  teams?: any[]
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
  return '\u2022'
}

function resolvePlayerName(playerId: number | undefined): string {
  if (playerId == null || !props.teams?.length) return ''
  for (const team of props.teams) {
    if (!team.players) continue
    for (const tp of team.players) {
      // Handle nested TeamPlayer format: { player: { id, name } }
      const pid = tp.player?.id ?? tp.id
      const pname = tp.player?.name ?? tp.name
      if (pid === playerId) return pname
    }
  }
  return ''
}

function labelFor(event: TimelineEvent): string {
  if (event.type === 'GOAL_SCORED') {
    const name = event.payload?.playerName || resolvePlayerName(event.payload?.playerId) || 'Jogador desconhecido'
    const minute = event.payload?.minute != null ? ` - ${event.payload.minute}'` : ''
    return `Gol de ${name}${minute}`
  }
  if (event.type === 'MATCH_STARTED') return 'Partida iniciada'
  if (event.type === 'MATCH_ENDED') return 'Partida encerrada'
  return event.type
}

function formatTime(ts: string): string {
  if (!ts) return ''
  return new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}
</script>

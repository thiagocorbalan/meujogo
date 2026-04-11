<script setup lang="ts">
const props = defineProps<{
  matches: any[]
  teams: any[]
}>()

function teamName(id: number | null | undefined): string {
  if (id == null) return '?'
  return props.teams.find((t) => t.id === id)?.name ?? `Time #${id}`
}

function isWinner(match: any, side: 'A' | 'B'): boolean {
  if (match.isDraw) return false
  const teamId = side === 'A' ? (match.teamAId ?? match.teamA?.id) : (match.teamBId ?? match.teamB?.id)
  return match.winnerId != null && match.winnerId === teamId
}

function winnerClass(match: any, side: 'A' | 'B'): string {
  if (isWinner(match, side)) return 'text-green-700'
  if (match.isDraw) return 'text-amber-700'
  if (match.winnerId != null) return 'text-muted-foreground'
  return ''
}
</script>

<template>
  <section v-if="matches.length > 0" class="mb-9">
    <h2 class="text-xl font-semibold text-foreground mb-4 pb-2 border-b-2 border-border">
      Partidas Concluídas
      <span class="text-base font-normal text-muted-foreground ml-1">({{ matches.length }})</span>
    </h2>
    <div class="flex flex-col gap-2">
      <div
        v-for="match in matches"
        :key="match.id"
        class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 rounded-md bg-muted text-foreground"
      >
        <span :class="['font-medium text-right', winnerClass(match, 'A')]">
          {{ teamName(match.teamAId ?? match.teamA?.id) }}
          <span v-if="isWinner(match, 'A')" class="ml-1 text-xs text-green-600 font-bold">V</span>
        </span>
        <span class="text-lg font-bold text-foreground text-center tracking-wider">
          {{ match.scoreA ?? 0 }} &times; {{ match.scoreB ?? 0 }}
        </span>
        <span :class="['font-medium text-left', winnerClass(match, 'B')]">
          <span v-if="isWinner(match, 'B')" class="mr-1 text-xs text-green-600 font-bold">V</span>
          {{ teamName(match.teamBId ?? match.teamB?.id) }}
        </span>
      </div>
    </div>
  </section>
</template>

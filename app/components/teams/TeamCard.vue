<template>
  <Card class="overflow-hidden">
    <div class="h-1.5 w-full" :style="{ backgroundColor: team.color }" />
    <CardHeader class="pb-3">
      <div class="flex items-baseline justify-between gap-2">
        <CardTitle class="text-lg">{{ team.name }}</CardTitle>
        <span v-if="team.avgElo !== undefined" class="text-xs text-muted-foreground whitespace-nowrap">
          ELO médio: <strong>{{ Math.round(team.avgElo) }}</strong>
        </span>
      </div>
    </CardHeader>
    <CardContent>
      <ul class="list-none m-0 p-0 flex flex-col gap-1.5">
        <li v-for="player in team.players" :key="player.id" class="flex justify-between items-center px-2 py-1.5 bg-muted rounded">
          <span class="text-sm text-foreground">{{ player.name }}</span>
          <span class="text-xs text-muted-foreground font-medium">{{ player.elo ?? '—' }}</span>
        </li>
      </ul>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

defineProps<{
  team: {
    name: string
    color: string
    players: { id: number; name: string; elo?: number }[]
    avgElo?: number
  }
}>()
</script>

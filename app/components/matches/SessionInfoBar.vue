<script setup lang="ts">
defineProps<{
  durationMinutes: number
  matchDurationMinutes: number
  totalMatches: number
  playedCount: number
  reachedMax: boolean
}>()
</script>

<template>
  <div class="mb-6 flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg px-5 py-3 text-sm text-slate-700">
    <span><strong>Sessão:</strong> {{ durationMinutes }} min total</span>
    <span class="text-slate-300">|</span>
    <span><strong>Partida:</strong> {{ matchDurationMinutes }} min cada</span>
    <span class="text-slate-300">|</span>
    <span><strong>Total de partidas:</strong> {{ totalMatches }}</span>
    <span class="text-slate-300">|</span>
    <span :class="reachedMax ? 'text-red-600 font-semibold' : 'text-slate-700'">
      <strong>Progresso:</strong> {{ playedCount }} de {{ totalMatches }}
    </span>
  </div>
</template>

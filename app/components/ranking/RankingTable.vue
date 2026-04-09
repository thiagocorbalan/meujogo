<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

defineProps<{ ranking: any[]; loading: boolean }>()
</script>

<template>
  <div>
    <p v-if="loading" class="text-muted-foreground text-sm py-5">Carregando...</p>
    <div v-else-if="ranking.length" class="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>J</TableHead>
            <TableHead>V</TableHead>
            <TableHead>E</TableHead>
            <TableHead>D</TableHead>
            <TableHead>GP</TableHead>
            <TableHead>GC</TableHead>
            <TableHead>SG</TableHead>
            <TableHead>PTS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(t, i) in ranking" :key="t.teamId" :class="{ 'bg-amber-50': i === 0 }">
            <TableCell>{{ i + 1 }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full shrink-0" :style="{ background: t.color || '#6b7280' }" />
                {{ t.name }}
              </div>
            </TableCell>
            <TableCell>{{ t.played }}</TableCell>
            <TableCell>{{ t.wins }}</TableCell>
            <TableCell>{{ t.draws }}</TableCell>
            <TableCell>{{ t.losses }}</TableCell>
            <TableCell>{{ t.goalsFor }}</TableCell>
            <TableCell>{{ t.goalsAgainst }}</TableCell>
            <TableCell>{{ t.goalDifference }}</TableCell>
            <TableCell class="font-bold">{{ t.points }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <p v-else class="text-muted-foreground text-sm py-5">Nenhuma partida registrada.</p>
  </div>
</template>

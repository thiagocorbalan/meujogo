<template>
  <div>
    <p v-if="loading" class="text-muted-foreground text-sm py-5">Carregando...</p>
    <div v-else-if="players.length" class="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-10">#</TableHead>
            <TableHead>Jogador</TableHead>
            <TableHead>Posicao</TableHead>
            <TableHead>ELO</TableHead>
            <TableHead>Gols</TableHead>
            <TableHead>Jogos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="(p, i) in players" :key="p.id" :class="{ 'bg-amber-50': i === 0 }">
            <TableCell>{{ i + 1 }}</TableCell>
            <TableCell class="font-medium">{{ p.name }}</TableCell>
            <TableCell>
              <span :class="p.position === 'GOLEIRO' ? 'text-blue-600' : 'text-green-600'" class="text-xs font-semibold">
                {{ p.position }}
              </span>
            </TableCell>
            <TableCell class="font-bold">{{ Math.round(p.elo) }}</TableCell>
            <TableCell>{{ p.goals }}</TableCell>
            <TableCell>{{ p.games }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <p v-else class="text-muted-foreground text-sm py-5">Nenhum jogador registrado.</p>
  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

defineProps<{ players: any[]; loading: boolean }>()
</script>

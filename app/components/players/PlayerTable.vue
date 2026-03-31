<template>
  <div class="w-full">
    <div v-if="loading" class="text-muted-foreground p-6 text-center text-sm">Carregando jogadores...</div>
    <div v-else class="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Posição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ELO</TableHead>
            <TableHead>Gols</TableHead>
            <TableHead>Jogos</TableHead>
            <TableHead v-if="showActions">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="player in players" :key="player.id">
            <TableCell>{{ player.name }}</TableCell>
            <TableCell>{{ player.position }}</TableCell>
            <TableCell>{{ player.type }}</TableCell>
            <TableCell>{{ player.status }}</TableCell>
            <TableCell>{{ player.elo ?? '—' }}</TableCell>
            <TableCell>{{ player.goals ?? 0 }}</TableCell>
            <TableCell>{{ player.games ?? 0 }}</TableCell>
            <TableCell v-if="showActions">
              <div class="flex gap-2">
                <BaseButton size="sm" variant="secondary" @click="emit('edit', player)">Editar</BaseButton>
                <BaseButton size="sm" variant="danger" @click="emit('delete', player)">Excluir</BaseButton>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="!players.length">
            <TableCell :colspan="showActions ? 8 : 7" class="text-center text-muted-foreground p-6 text-sm">
              Nenhum jogador encontrado.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

withDefaults(defineProps<{
  players: any[]
  loading: boolean
  showActions?: boolean
}>(), {
  showActions: true,
})

const emit = defineEmits<{
  edit: [player: any]
  delete: [player: any]
}>()
</script>

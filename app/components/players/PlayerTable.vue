<template>
  <div class="w-full">
    <div v-if="loading" class="text-muted-foreground p-6 text-center text-sm">Carregando jogadores...</div>
    <div v-else class="overflow-x-auto border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Posição</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ELO</TableHead>
            <TableHead>Gols</TableHead>
            <TableHead>Jogos</TableHead>
            <TableHead v-if="showActions">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="player in players" :key="player.id">
            <TableCell>
              <div class="flex items-center gap-2">
                <span>{{ player.name }}</span>
                <span
                  v-if="player.type === 'CONVIDADO'"
                  class="inline-flex items-center rounded-full bg-orange-500 text-white px-2 py-0.5 text-[11px] font-semibold"
                >
                  Avulso
                </span>
                <span
                  v-if="player.status === 'AUSENTE'"
                  class="inline-flex items-center rounded-full bg-amber-500 text-white px-2 py-0.5 text-[11px] font-semibold"
                >
                  Suspenso
                </span>
              </div>
            </TableCell>
            <TableCell>{{ positionLabel(player.position) }}</TableCell>
            <TableCell>
              <span :class="statusClass(player.status)">{{ statusLabel(player.status) }}</span>
            </TableCell>
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
            <TableCell :colspan="showActions ? 7 : 6" class="text-center text-muted-foreground p-6 text-sm">
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
  showActions: false,
})

const emit = defineEmits<{
  edit: [player: any]
  delete: [player: any]
}>()

function positionLabel(position: string) {
  return position === 'GOLEIRO' ? 'Goleiro' : 'Linha'
}

function statusLabel(status: string) {
  switch (status) {
    case 'ATIVO': return 'Ativo'
    case 'LESIONADO': return 'Lesionado'
    case 'AUSENTE': return 'Ausente'
    case 'RESERVA': return 'Reserva'
    default: return status
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'ATIVO': return 'text-green-600 font-medium'
    case 'LESIONADO': return 'text-red-600 font-medium'
    case 'AUSENTE': return 'text-amber-600 font-medium'
    case 'RESERVA': return 'text-blue-600 font-medium'
    default: return ''
  }
}
</script>

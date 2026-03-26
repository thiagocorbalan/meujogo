<template>
  <div>
    <p v-if="loading" class="text-muted-foreground text-sm py-5">Carregando...</p>
    <div v-else-if="attendances.length" class="w-full overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Posição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="a in attendances" :key="a.id">
            <TableCell>{{ a.player?.name }}</TableCell>
            <TableCell>{{ a.player?.position }}</TableCell>
            <TableCell>{{ a.player?.type }}</TableCell>
            <TableCell>
              <Badge :variant="badgeVariant(a.status)">{{ a.status }}</Badge>
            </TableCell>
            <TableCell>
              <div class="flex gap-1 flex-wrap">
                <BaseButton size="sm" :disabled="disabled" :title="disabled ? 'Não é possível alterar durante partida ao vivo' : ''" @click="$emit('update', a.player?.id ?? a.playerId, 'ATIVO')">Confirmar</BaseButton>
                <BaseButton size="sm" variant="secondary" :disabled="disabled" @click="$emit('update', a.player?.id ?? a.playerId, 'LESIONADO')">Lesionado</BaseButton>
                <BaseButton size="sm" variant="secondary" :disabled="disabled" @click="$emit('update', a.player?.id ?? a.playerId, 'RESERVA')">Reserva</BaseButton>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <p v-else class="text-muted-foreground text-sm py-5">Nenhum jogador encontrado.</p>
  </div>
</template>

<script setup lang="ts">
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

defineProps<{ attendances: any[]; disabled: boolean; loading: boolean }>()
defineEmits<{ update: [playerId: number, status: string] }>()

function badgeVariant(status: string) {
  const map: Record<string, string> = {
    ATIVO: 'default',
    LESIONADO: 'secondary',
    AUSENTE: 'destructive',
    RESERVA: 'outline',
  }
  return (map[status] ?? 'secondary') as any
}
</script>

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
            <TableHead v-if="showActions">Ações</TableHead>
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
            <TableCell v-if="showActions">
              <div class="flex items-center gap-2 flex-wrap">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <Switch
                    :model-value="a.status === 'ATIVO'"
                    :disabled="disabled"
                    :aria-label="`Confirmar presença de ${a.player?.name}`"
                    @update:model-value="(val: boolean) => $emit('update', a.player?.id ?? a.playerId, val ? 'ATIVO' : 'AUSENTE')"
                  />
                  <span class="text-xs text-muted-foreground select-none">{{ a.status === 'ATIVO' ? 'Confirmado' : 'Ausente' }}</span>
                </label>
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
import { Switch } from '@/components/ui/switch'

withDefaults(defineProps<{ attendances: any[]; disabled: boolean; loading: boolean; showActions?: boolean }>(), {
  showActions: true,
})
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

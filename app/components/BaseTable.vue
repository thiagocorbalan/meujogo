<template>
  <div class="w-full overflow-x-auto rounded-lg border">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead v-for="col in columns" :key="col.key">{{ col.label }}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-for="(item, index) in data" :key="index">
          <template v-if="$slots.row">
            <slot name="row" :item="item" :index="index" />
          </template>
          <template v-else>
            <TableCell v-for="col in columns" :key="col.key">{{ item[col.key] }}</TableCell>
          </template>
        </TableRow>
        <TableRow v-if="!data || data.length === 0">
          <TableCell :colspan="columns.length" class="text-center text-muted-foreground italic py-6">
            Nenhum registro encontrado.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>

<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

defineProps<{
  columns: { key: string; label: string }[]
  data?: any[]
}>()
</script>

<script setup lang="ts">
import { CheckCircle2, AlertTriangle, Ban } from 'lucide-vue-next'

const props = defineProps<{
  status: 'active' | 'inactive' | 'suspended'
  label?: string
}>()

const config = computed(() => {
  const map: Record<string, { icon: any; color: string; text: string }> = {
    active: { icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200', text: 'Ativo' },
    inactive: { icon: AlertTriangle, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', text: 'Inativo' },
    suspended: { icon: Ban, color: 'text-red-600 bg-red-50 border-red-200', text: 'Suspenso' },
  }
  return map[props.status] ?? map.inactive
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium',
      config.color,
    ]"
  >
    <component :is="config.icon" class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
    {{ label ?? config.text }}
  </span>
</template>

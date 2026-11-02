<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card'

const props = defineProps<{
  label: string
  value: string | number
  subtitle?: string
  icon?: Component
}>()
</script>

<template>
  <Card
    role="region"
    :aria-label="`${props.label}: ${props.value}`"
    class="bg-card"
  >
    <CardContent class="p-5 flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{{ props.label }}</p>
        <p class="text-3xl font-bold text-foreground leading-none">{{ props.value }}</p>
        <p v-if="props.subtitle" class="text-xs text-muted-foreground mt-1.5">{{ props.subtitle }}</p>
      </div>
      <div v-if="props.icon" class="shrink-0 mt-0.5 text-muted-foreground" aria-hidden="true">
        <component :is="props.icon" class="w-5 h-5" />
      </div>
    </CardContent>
  </Card>
</template>

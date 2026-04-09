<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  value: string | number
  color?: string
}>(), {
  color: '#3b82f6',
})
</script>

<template>
  <div class="bg-white border-l-4 rounded-lg px-5 py-4 shadow-sm" :style="{ borderLeftColor: color }">
    <p class="text-xs text-muted-foreground mb-2 uppercase tracking-wide">{{ title }}</p>
    <p class="text-2xl font-bold text-foreground">{{ value }}</p>
  </div>
</template>

<template>
  <Button
    :variant="mappedVariant"
    :size="mappedSize"
    :disabled="disabled || loading"
    v-bind="$attrs"
  >
    <svg v-if="loading" class="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
    <slot />
  </Button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  variant?: string
  size?: string
  disabled?: boolean
  loading?: boolean
}>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  loading: false,
})

const mappedVariant = computed(() => {
  const map: Record<string, string> = {
    primary: 'default',
    secondary: 'secondary',
    danger: 'destructive',
  }
  return (map[props.variant] ?? props.variant) as any
})

const mappedSize = computed(() => {
  const map: Record<string, string> = {
    md: 'default',
  }
  return (map[props.size] ?? props.size) as any
})
</script>

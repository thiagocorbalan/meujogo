<script setup lang="ts">
import { Input } from '@/components/ui/input'

const props = withDefaults(defineProps<{ modelValue?: string; placeholder?: string }>(), {
  placeholder: 'Buscar...',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

let timer: ReturnType<typeof setTimeout>
function onInput(e: Event) {
  clearTimeout(timer)
  timer = setTimeout(() => emit('update:modelValue', (e.target as HTMLInputElement).value), 300)
}
</script>

<template>
  <Input
    type="text"
    :model-value="modelValue"
    :placeholder="placeholder"
    @input="onInput"
  />
</template>

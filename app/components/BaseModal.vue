<script setup lang="ts">
import { DialogRoot } from 'reka-ui'
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

defineProps<{
  show: boolean
  title?: string
}>()

const emit = defineEmits<{ close: [] }>()

function onOpenChange(val: boolean) {
  if (!val) emit('close')
}
</script>

<template>
  <DialogRoot :open="show" @update:open="onOpenChange">
    <DialogContent class="sm:max-w-[520px]">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>
      <div>
        <slot />
      </div>
      <DialogFooter v-if="$slots.footer">
        <slot name="footer" />
      </DialogFooter>
    </DialogContent>
  </DialogRoot>
</template>

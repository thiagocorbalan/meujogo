<template>
  <button
    class="flex items-center justify-between w-full px-2.5 py-2 bg-green-50 border border-green-200 rounded-md cursor-pointer text-sm text-green-800 transition-colors hover:bg-green-100 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
    :disabled="disabled"
    @click="emit('goal', player.id, teamId)"
  >
    <span class="font-medium text-left flex-1">{{ player.name }}</span>
    <span class="text-base ml-1.5">&#9917;</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  player: { id: number; name: string }
  teamId: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'goal', playerId: number, teamId: number): void
}>()
</script>

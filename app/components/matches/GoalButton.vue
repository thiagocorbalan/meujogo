<script setup lang="ts">
defineProps<{
  player: { id: number; name: string }
  teamId: number
  disabled?: boolean
  isSubstitute?: boolean
  sourceTeamName?: string
}>()

const emit = defineEmits<{
  (e: 'goal', playerId: number, teamId: number): void
}>()
</script>

<template>
  <button
    class="flex items-center justify-between w-full min-h-[44px] px-2.5 py-2 bg-green-50 border border-green-200 rounded-md cursor-pointer text-sm text-green-800 transition-colors hover:bg-green-100 hover:border-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
    :disabled="disabled"
    :aria-label="`Registrar gol para ${player.name}`"
    @click="emit('goal', player.id, teamId)"
  >
    <span class="font-medium text-left flex-1 flex items-center gap-1.5">
      {{ player.name }}
      <MatchesSubstitutionBadge
        v-if="isSubstitute"
        :is-substitute="isSubstitute"
        :source-team-name="sourceTeamName"
      />
    </span>
    <span class="text-base ml-1.5" aria-hidden="true">&#9917;</span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  isSubstitute: boolean
  sourceTeamName?: string
}>()

const ariaLabel = computed(() =>
  props.sourceTeamName
    ? `Jogador substituto (veio de ${props.sourceTeamName})`
    : 'Jogador substituto',
)
</script>

<template>
  <span
    v-if="isSubstitute"
    data-testid="substitution-badge"
    :aria-label="ariaLabel"
    class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900"
  >
    <span aria-hidden="true">SUB</span>
    <span v-if="sourceTeamName" class="text-amber-700">• {{ sourceTeamName }}</span>
  </span>
</template>

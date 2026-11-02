<script setup lang="ts">
import { onMounted, ref, useId } from 'vue'
import GoalListItem, { type GoalDisplay } from './GoalListItem.vue'

const props = defineProps<{
  goals: GoalDisplay[]
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'undo-goal', goal: GoalDisplay): void
}>()

const titleId = `goal-list-title-${useId()}`
const titleRef = ref<HTMLElement | null>(null)

onMounted(() => {
  titleRef.value?.focus()
})

function handleUndo(goal: GoalDisplay) {
  emit('undo-goal', goal)
}

function handleClose() {
  emit('close')
}

function handleBackdropClick() {
  emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
    @click.self="handleBackdropClick"
  >
    <div
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[60vh] sm:max-h-[70vh]"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h2
          :id="titleId"
          ref="titleRef"
          tabindex="-1"
          class="text-lg font-bold text-slate-900 focus:outline-none"
        >
          Gols ({{ goals.length }})
        </h2>
        <button
          type="button"
          aria-label="Fechar lista de gols"
          class="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          @click="handleClose"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-3">
        <p v-if="goals.length === 0" class="text-center text-sm text-slate-500 py-6">
          Nenhum gol registrado ainda.
        </p>
        <ul v-else class="flex flex-col gap-2">
          <GoalListItem
            v-for="goal in goals"
            :key="goal.id"
            :goal="goal"
            :disabled="disabled"
            @undo="handleUndo"
          />
        </ul>
      </div>
    </div>
  </div>
</template>

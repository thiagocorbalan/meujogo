<script setup lang="ts">
import { ref, computed, watch, onMounted, useId } from 'vue'

interface MatchOption {
  id: number
  teamAId: number
  teamAName: string
  teamBId: number
  teamBName: string
  scoreA: number
  scoreB: number
}

interface LateGoalPayload {
  matchId: number
  teamId: number
  reason?: string
}

const props = defineProps<{
  matches: MatchOption[]
  initialMatchId: number | null
  loading: boolean
}>()

const emit = defineEmits<{
  confirm: [payload: LateGoalPayload]
  close: []
}>()

const matchIdRef = ref<number | null>(props.initialMatchId)
const teamIdRef = ref<number | null>(null)
const reasonRef = ref<string>('')

const titleId = useId()
const matchSelectId = useId()
const teamSelectId = useId()
const reasonId = useId()
const matchSelectRef = ref<HTMLSelectElement | null>(null)

const selectedMatch = computed<MatchOption | null>(() => {
  if (matchIdRef.value === null) return null
  return props.matches.find((m) => m.id === matchIdRef.value) ?? null
})

const canConfirm = computed(() => {
  return (
    !props.loading &&
    matchIdRef.value !== null &&
    teamIdRef.value !== null &&
    selectedMatch.value !== null
  )
})

watch(
  () => props.initialMatchId,
  (value) => {
    matchIdRef.value = value
    teamIdRef.value = null
  },
)

watch(matchIdRef, () => {
  teamIdRef.value = null
})

onMounted(() => {
  matchSelectRef.value?.focus()
})

function handleConfirm() {
  if (!canConfirm.value) return
  const payload: LateGoalPayload = {
    matchId: matchIdRef.value as number,
    teamId: teamIdRef.value as number,
  }
  const trimmed = reasonRef.value.trim()
  if (trimmed.length > 0) {
    payload.reason = trimmed
  }
  emit('confirm', payload)
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <div
    role="dialog"
    aria-modal="true"
    :aria-labelledby="titleId"
    class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
  >
    <div
      class="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[90vh]"
    >
      <div class="flex items-center justify-between p-4 border-b">
        <h2 :id="titleId" class="text-lg font-semibold text-foreground m-0">
          Adicionar gol tardio
        </h2>
        <button
          type="button"
          data-testid="late-goal-close"
          class="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded hover:bg-gray-100"
          aria-label="Fechar dialogo de gol tardio"
          @click="handleClose"
        >
          <span aria-hidden="true" class="text-2xl leading-none">&times;</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          role="alert"
          class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          O gol sera adicionado apenas ao placar do time. Nenhum jogador sera creditado. O
          resultado oficial da partida (vencedor/empate) nao sera alterado.
        </div>

        <div class="space-y-1">
          <label :for="matchSelectId" class="block text-sm font-medium text-foreground">
            Partida
          </label>
          <select
            :id="matchSelectId"
            ref="matchSelectRef"
            v-model.number="matchIdRef"
            data-testid="late-goal-match"
            class="w-full min-h-[48px] rounded border border-gray-300 px-3 py-2"
          >
            <option :value="null" disabled>Selecione a partida</option>
            <option v-for="m in matches" :key="m.id" :value="m.id">
              {{ m.teamAName }} {{ m.scoreA }} x {{ m.scoreB }} {{ m.teamBName }}
            </option>
          </select>
        </div>

        <div class="space-y-1">
          <label :for="teamSelectId" class="block text-sm font-medium text-foreground">
            Time que marcou
          </label>
          <select
            :id="teamSelectId"
            v-model.number="teamIdRef"
            data-testid="late-goal-team"
            :disabled="!selectedMatch"
            class="w-full min-h-[48px] rounded border border-gray-300 px-3 py-2 disabled:bg-gray-50"
          >
            <option :value="null" disabled>Selecione o time</option>
            <template v-if="selectedMatch">
              <option :value="selectedMatch.teamAId">{{ selectedMatch.teamAName }}</option>
              <option :value="selectedMatch.teamBId">{{ selectedMatch.teamBName }}</option>
            </template>
          </select>
        </div>

        <div class="space-y-1">
          <label :for="reasonId" class="block text-sm font-medium text-foreground">
            Observacao (opcional)
          </label>
          <textarea
            :id="reasonId"
            v-model="reasonRef"
            data-testid="late-goal-reason"
            rows="2"
            maxlength="500"
            class="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            placeholder="Ex: gol esquecido no intervalo"
          ></textarea>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 p-4 border-t">
        <button
          type="button"
          class="min-h-[48px] px-4 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50"
          @click="handleClose"
        >
          Cancelar
        </button>
        <button
          type="button"
          data-testid="late-goal-confirm"
          :disabled="!canConfirm"
          class="min-h-[48px] px-4 rounded bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
          @click="handleConfirm"
        >
          Confirmar
        </button>
      </div>
    </div>
  </div>
</template>

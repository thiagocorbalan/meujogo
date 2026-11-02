<script setup lang="ts">
import { ref, computed, watch, useId } from 'vue'

interface TeamInfo {
  id: number
  name: string
  color: string
}

interface TeamWithPlayers {
  id: number
  name: string
  players?: { id: number; name: string }[]
}

interface ActiveMatchInfo {
  id: number
  teamAId: number
  teamBId: number
  teamA: TeamWithPlayers
  teamB: TeamWithPlayers
}

interface PoolPlayer {
  id: number
  name: string
}

interface WaitingTeam {
  team: TeamInfo
  players: PoolPlayer[]
}

interface AvailablePool {
  reserves: PoolPlayer[]
  waitingTeams: WaitingTeam[]
}

type SubType = 'TEMPORARIA' | 'PERMANENTE'
type SubReason = 'LESAO' | 'CANSACO' | 'SEM_MOTIVO'

interface ConfirmPayload {
  teamId: number
  playerOutId: number
  playerInId: number
  type: SubType
  reason: SubReason
  minute?: number | null
}

const props = defineProps<{
  show: boolean
  teams: TeamInfo[]
  activeMatch: ActiveMatchInfo | null
  availablePool: AvailablePool
  loading: boolean
  currentMinute?: number | null
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: ConfirmPayload]
}>()

const step = ref<1 | 2 | 3 | 4>(1)
const selectedTeamId = ref<number | null>(null)
const playerOutId = ref<number | null>(null)
const playerInId = ref<number | null>(null)
const reason = ref<SubReason | null>(null)
const type = ref<SubType | null>(null)
const typeOverridden = ref(false)

const titleId = useId()

const teamOptions = computed(() => {
  if (!props.activeMatch) return []
  return [props.activeMatch.teamA, props.activeMatch.teamB]
})

const selectedTeamPlayers = computed(() => {
  const team = teamOptions.value.find((t) => t.id === selectedTeamId.value)
  return team?.players ?? []
})

const selectedPlayerOut = computed(() =>
  selectedTeamPlayers.value.find((p) => p.id === playerOutId.value) ?? null,
)

const playerInContext = computed(() => {
  if (playerInId.value === null) return null
  const reserve = props.availablePool.reserves.find((p) => p.id === playerInId.value)
  if (reserve) {
    return { player: reserve, sourceTeam: null as TeamInfo | null }
  }
  for (const wt of props.availablePool.waitingTeams) {
    const p = wt.players.find((pp) => pp.id === playerInId.value)
    if (p) return { player: p, sourceTeam: wt.team }
  }
  return null
})

const selectedTeamInfo = computed(() => {
  return teamOptions.value.find((t) => t.id === selectedTeamId.value) ?? null
})

const showInterTeamWarning = computed(() => {
  return (
    type.value === 'PERMANENTE' &&
    playerInContext.value?.sourceTeam !== null &&
    playerInContext.value?.sourceTeam !== undefined
  )
})

const canConfirm = computed(() => {
  return (
    !props.loading &&
    selectedTeamId.value !== null &&
    playerOutId.value !== null &&
    playerInId.value !== null &&
    reason.value !== null &&
    type.value !== null
  )
})

function selectTeam(id: number) {
  selectedTeamId.value = id
  playerOutId.value = null
  step.value = 2
}

function selectPlayerOut(id: number) {
  playerOutId.value = id
  playerInId.value = null
  step.value = 3
}

function selectPlayerIn(id: number) {
  playerInId.value = id
  step.value = 4
}

function selectReason(r: SubReason) {
  reason.value = r
  if (!typeOverridden.value) {
    if (r === 'LESAO') type.value = 'PERMANENTE'
    else if (r === 'CANSACO') type.value = 'TEMPORARIA'
    else type.value = null
  }
}

function selectType(t: SubType) {
  if (!props.activeMatch && t === 'TEMPORARIA') return
  type.value = t
  typeOverridden.value = true
}

function back() {
  if (step.value > 1) {
    step.value = (step.value - 1) as 1 | 2 | 3
  }
}

function handleConfirm() {
  if (!canConfirm.value) return
  emit('confirm', {
    teamId: selectedTeamId.value as number,
    playerOutId: playerOutId.value as number,
    playerInId: playerInId.value as number,
    type: type.value as SubType,
    reason: reason.value as SubReason,
    minute: props.currentMinute ?? null,
  })
}

function handleClose() {
  emit('close')
}

watch(
  () => props.show,
  (v) => {
    if (v) {
      step.value = 1
      selectedTeamId.value = null
      playerOutId.value = null
      playerInId.value = null
      reason.value = null
      type.value = null
      typeOverridden.value = false
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="show"
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
          Substituir jogador
        </h2>
        <button
          type="button"
          class="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded hover:bg-gray-100"
          aria-label="Fechar dialogo de substituicao"
          @click="handleClose"
        >
          <span aria-hidden="true" class="text-2xl leading-none">&times;</span>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-if="!activeMatch"
          data-testid="sub-between-matches-notice"
          role="note"
          class="rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-900"
        >
          Substituicao entre partidas. Apenas PERMANENTE esta disponivel.
        </div>

        <ol class="flex items-center gap-2 text-xs text-gray-500" aria-label="Passos">
          <li :aria-current="step === 1 ? 'step' : undefined">1. Time</li>
          <li aria-hidden="true">›</li>
          <li :aria-current="step === 2 ? 'step' : undefined">2. Sai</li>
          <li aria-hidden="true">›</li>
          <li :aria-current="step === 3 ? 'step' : undefined">3. Entra</li>
          <li aria-hidden="true">›</li>
          <li :aria-current="step === 4 ? 'step' : undefined">4. Motivo</li>
        </ol>

        <section v-if="step === 1" data-testid="sub-step-1" class="space-y-2">
          <h3 class="text-sm font-semibold">Qual time vai receber a substituicao?</h3>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="team in teamOptions"
              :key="team.id"
              type="button"
              data-testid="sub-team-option"
              class="min-h-[48px] px-4 rounded border border-gray-300 text-sm font-semibold hover:bg-gray-50"
              @click="selectTeam(team.id)"
            >
              {{ team.name }}
            </button>
          </div>
        </section>

        <section v-else-if="step === 2" data-testid="sub-step-2" class="space-y-2">
          <h3 class="text-sm font-semibold">Quem vai sair?</h3>
          <div class="grid grid-cols-1 gap-2">
            <button
              v-for="player in selectedTeamPlayers"
              :key="player.id"
              type="button"
              data-testid="sub-player-out"
              class="min-h-[48px] px-4 rounded border border-gray-300 text-sm font-semibold hover:bg-gray-50"
              @click="selectPlayerOut(player.id)"
            >
              {{ player.name }}
            </button>
          </div>
        </section>

        <section v-else-if="step === 3" data-testid="sub-step-3" class="space-y-3">
          <h3 class="text-sm font-semibold">Quem vai entrar?</h3>
          <div
            v-if="availablePool.reserves.length > 0"
            data-testid="sub-pool-group-reserves"
            class="space-y-2"
          >
            <div class="text-xs font-semibold uppercase text-gray-500">Reservas</div>
            <button
              v-for="player in availablePool.reserves"
              :key="`res-${player.id}`"
              type="button"
              data-testid="sub-player-in"
              class="w-full min-h-[48px] px-4 rounded border border-gray-300 text-sm font-semibold text-left hover:bg-gray-50"
              @click="selectPlayerIn(player.id)"
            >
              {{ player.name }}
            </button>
          </div>
          <div
            v-for="wt in availablePool.waitingTeams"
            :key="wt.team.id"
            :data-testid="`sub-pool-group-team-${wt.team.id}`"
            class="space-y-2"
          >
            <div class="text-xs font-semibold uppercase text-gray-500">{{ wt.team.name }}</div>
            <button
              v-for="player in wt.players"
              :key="`wt-${player.id}`"
              type="button"
              data-testid="sub-player-in"
              class="w-full min-h-[48px] px-4 rounded border border-gray-300 text-sm font-semibold text-left hover:bg-gray-50"
              @click="selectPlayerIn(player.id)"
            >
              {{ player.name }}
            </button>
          </div>
        </section>

        <section v-else-if="step === 4" data-testid="sub-step-4" class="space-y-3">
          <div
            data-testid="sub-summary"
            class="rounded border border-gray-200 bg-gray-50 p-3 text-sm"
          >
            <div><strong>Time:</strong> {{ selectedTeamInfo?.name }}</div>
            <div><strong>Sai:</strong> {{ selectedPlayerOut?.name }}</div>
            <div><strong>Entra:</strong> {{ playerInContext?.player.name }}</div>
            <div v-if="playerInContext?.sourceTeam">
              <strong>De:</strong> {{ playerInContext.sourceTeam.name }}
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-xs font-semibold uppercase text-gray-500">Motivo</div>
            <div class="grid grid-cols-3 gap-2">
              <button
                type="button"
                data-testid="sub-reason-LESAO"
                :aria-pressed="reason === 'LESAO'"
                class="min-h-[48px] px-2 rounded border text-xs font-semibold"
                :class="reason === 'LESAO' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
                @click="selectReason('LESAO')"
              >
                Lesao
              </button>
              <button
                type="button"
                data-testid="sub-reason-CANSACO"
                :aria-pressed="reason === 'CANSACO'"
                class="min-h-[48px] px-2 rounded border text-xs font-semibold"
                :class="reason === 'CANSACO' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
                @click="selectReason('CANSACO')"
              >
                Cansaco
              </button>
              <button
                type="button"
                data-testid="sub-reason-SEM_MOTIVO"
                :aria-pressed="reason === 'SEM_MOTIVO'"
                class="min-h-[48px] px-2 rounded border text-xs font-semibold"
                :class="reason === 'SEM_MOTIVO' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
                @click="selectReason('SEM_MOTIVO')"
              >
                Sem motivo
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-xs font-semibold uppercase text-gray-500">Tipo</div>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="sub-type-TEMPORARIA"
                :aria-pressed="type === 'TEMPORARIA'"
                :disabled="!activeMatch"
                class="min-h-[48px] px-2 rounded border text-xs font-semibold disabled:opacity-60"
                :class="type === 'TEMPORARIA' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
                @click="selectType('TEMPORARIA')"
              >
                Temporaria
              </button>
              <button
                type="button"
                data-testid="sub-type-PERMANENTE"
                :aria-pressed="type === 'PERMANENTE'"
                class="min-h-[48px] px-2 rounded border text-xs font-semibold"
                :class="type === 'PERMANENTE' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'"
                @click="selectType('PERMANENTE')"
              >
                Permanente
              </button>
            </div>
          </div>

          <div
            v-if="showInterTeamWarning"
            role="alert"
            class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
          >
            Time {{ playerInContext?.sourceTeam?.name }} ficara desfalcado nas proximas partidas.
          </div>
        </section>
      </div>

      <div class="flex items-center justify-between gap-2 p-4 border-t">
        <button
          v-if="step > 1"
          type="button"
          data-testid="sub-back"
          class="min-h-[48px] px-4 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50"
          @click="back"
        >
          Voltar
        </button>
        <div v-else />
        <div class="flex gap-2">
          <button
            type="button"
            class="min-h-[48px] px-4 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50"
            @click="handleClose"
          >
            Cancelar
          </button>
          <button
            v-if="step === 4"
            type="button"
            data-testid="sub-confirm"
            :disabled="!canConfirm"
            class="min-h-[48px] px-4 rounded bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
            @click="handleConfirm"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

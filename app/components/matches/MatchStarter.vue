<script setup lang="ts">
const props = defineProps<{
  teams: any[]
  isFirstMatch: boolean
  nextMatchSuggestion: any | null
  loadingNextMatch: boolean
  loading: boolean
  twoTeamMode: boolean
}>()

const emit = defineEmits<{
  start: [teamAId: number, teamBId: number]
}>()

const selectedTeamA = ref<number | null>(null)
const selectedTeamB = ref<number | null>(null)

function teamName(id: number | null | undefined): string {
  if (id == null) return '?'
  return props.teams.find((t) => t.id === id)?.name ?? `Time #${id}`
}

function handleStartSuggested() {
  const s = props.nextMatchSuggestion
  if (!s) return
  emit('start', s.teamA?.id ?? s.teamAId, s.teamB?.id ?? s.teamBId)
}

function handleStartManual() {
  if (!selectedTeamA.value || !selectedTeamB.value) return
  emit('start', selectedTeamA.value, selectedTeamB.value)
  selectedTeamA.value = null
  selectedTeamB.value = null
}

function handleStartTwoTeam() {
  if (props.teams.length < 2) return
  emit('start', props.teams[0].id, props.teams[1].id)
}
</script>

<template>
  <div class="bg-white border rounded-lg p-5 flex flex-col gap-4">
    <!-- Modo 2 times: botão direto -->
    <template v-if="twoTeamMode">
      <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 rounded-md bg-blue-50 text-blue-800">
        <span class="text-lg font-semibold text-right">{{ teams[0]?.name }}</span>
        <span class="text-sm font-bold text-blue-500 text-center">vs</span>
        <span class="text-lg font-semibold text-left">{{ teams[1]?.name }}</span>
      </div>
      <BaseButton variant="primary" size="md" :loading="loading" @click="handleStartTwoTeam">
        Iniciar Partida
      </BaseButton>
    </template>

    <!-- Modo rotação: primeira partida — seleção manual -->
    <template v-else-if="isFirstMatch">
      <p class="text-sm text-muted-foreground mb-1">Selecione os times para a primeira partida:</p>
      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-foreground">Time A</label>
          <select v-model="selectedTeamA" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option :value="null" disabled>Selecione...</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-semibold text-foreground">Time B</label>
          <select v-model="selectedTeamB" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            <option :value="null" disabled>Selecione...</option>
            <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>
      <BaseButton
        variant="primary"
        size="md"
        :loading="loading"
        :disabled="!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB"
        @click="handleStartManual"
      >
        Iniciar Partida
      </BaseButton>
    </template>

    <!-- Modo rotação: partidas seguintes — sugestão do motor -->
    <template v-else>
      <div v-if="loadingNextMatch" class="text-center py-4 text-muted-foreground text-sm">
        Carregando próxima partida...
      </div>
      <template v-else-if="nextMatchSuggestion">
        <p class="text-sm text-muted-foreground mb-1">Próxima partida sugerida pelo rodízio:</p>
        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 rounded-md bg-blue-50 text-blue-800">
          <span class="text-lg font-semibold text-right">{{ nextMatchSuggestion.teamA?.name ?? teamName(nextMatchSuggestion.teamA?.id ?? nextMatchSuggestion.teamAId) }}</span>
          <span class="text-sm font-bold text-blue-500 text-center">vs</span>
          <span class="text-lg font-semibold text-left">{{ nextMatchSuggestion.teamB?.name ?? teamName(nextMatchSuggestion.teamB?.id ?? nextMatchSuggestion.teamBId) }}</span>
        </div>
        <BaseButton variant="primary" size="md" :loading="loading" @click="handleStartSuggested">
          Iniciar Partida
        </BaseButton>
      </template>
      <div v-else class="text-center py-4 text-muted-foreground text-sm">
        <p>Não foi possível obter a próxima partida automaticamente.</p>
        <p class="text-xs mt-1">Selecione manualmente abaixo:</p>
        <div class="grid grid-cols-2 gap-4 mt-3 text-left">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-foreground">Time A</label>
            <select v-model="selectedTeamA" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option :value="null" disabled>Selecione...</option>
              <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-semibold text-foreground">Time B</label>
            <select v-model="selectedTeamB" class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <option :value="null" disabled>Selecione...</option>
              <option v-for="t in teams" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
          </div>
        </div>
        <BaseButton
          variant="primary"
          size="md"
          class="mt-3"
          :loading="loading"
          :disabled="!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB"
          @click="handleStartManual"
        >
          Iniciar Partida
        </BaseButton>
      </div>
    </template>
  </div>
</template>

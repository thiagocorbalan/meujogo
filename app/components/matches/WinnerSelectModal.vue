<script setup lang="ts">
defineProps<{
  show: boolean
  loading: boolean
  teamAName: string
  teamBName: string
  teamAId: number | null
  teamBId: number | null
}>()

const emit = defineEmits<{
  close: []
  select: [winnerId: number]
}>()
</script>

<template>
  <BaseModal :show="show" title="Empate -- Escolha o vencedor" @close="$emit('close')">
    <p class="text-foreground text-sm mb-4">
      A primeira partida terminou em empate. Escolha o time vencedor para fins de rodízio (ambos os times recebem 1 ponto):
    </p>
    <div class="flex gap-3 justify-center">
      <BaseButton v-if="teamAId" variant="primary" size="md" :loading="loading" @click="$emit('select', teamAId)">
        {{ teamAName }}
      </BaseButton>
      <BaseButton v-if="teamBId" variant="primary" size="md" :loading="loading" @click="$emit('select', teamBId)">
        {{ teamBName }}
      </BaseButton>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  goal: { id: number; playerName: string; teamName: string; minute?: number } | null
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal :show="show" title="Desfazer Gol" @close="emit('close')">
    <p v-if="goal" class="text-sm text-foreground">
      Tem certeza que deseja desfazer o gol de
      <strong>{{ goal.playerName }}</strong>
      ({{ goal.teamName }})
      <template v-if="goal.minute"> no minuto {{ goal.minute }}</template>?
    </p>
    <p class="text-xs text-muted-foreground mt-2">
      Esta acao ira remover o gol do placar, das estatisticas do jogador e dos eventos da partida.
    </p>
    <template #footer>
      <BaseButton variant="secondary" size="sm" @click="emit('close')">Cancelar</BaseButton>
      <BaseButton variant="danger" size="sm" :loading="loading" @click="emit('confirm')">
        Desfazer Gol
      </BaseButton>
    </template>
  </BaseModal>
</template>

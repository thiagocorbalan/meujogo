<script setup lang="ts">
defineProps<{
  show: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal :show="show" title="Encerrar Sessão" @close="$emit('close')">
    <p class="text-foreground text-sm">
      Deseja realmente encerrar a sessão? Essa ação vai salvar todos os resultados, atualizar o ELO dos jogadores e finalizar a sessão.
    </p>
    <template #footer>
      <BaseButton variant="secondary" size="sm" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton variant="danger" size="sm" :loading="loading" @click="$emit('confirm')">Confirmar Encerramento</BaseButton>
    </template>
  </BaseModal>
</template>

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
  <BaseModal :show="show" title="Encerrar Partida" @close="$emit('close')">
    <p class="text-foreground text-sm">Deseja realmente encerrar a partida atual?</p>
    <template #footer>
      <BaseButton variant="secondary" size="sm" @click="$emit('close')">Cancelar</BaseButton>
      <BaseButton variant="danger" size="sm" :loading="loading" @click="$emit('confirm')">Encerrar</BaseButton>
    </template>
  </BaseModal>
</template>

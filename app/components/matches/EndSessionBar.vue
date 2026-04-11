<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

const emit = defineEmits<{
  'end-session': []
}>()
</script>

<template>
  <section class="mb-9 pt-4 border-t border-border">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold text-foreground">Encerrar Sessão</h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          Finaliza a sessão, salva os resultados, atualiza ELO e estatísticas dos jogadores.
        </p>
      </div>
      <BaseButton variant="danger" size="md" :loading="loading" @click="$emit('end-session')">
        Encerrar Sessão
      </BaseButton>
    </div>
  </section>
</template>

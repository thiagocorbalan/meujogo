<script setup lang="ts">
defineProps<{
  loading: boolean
}>()

defineEmits<{
  'end-session': []
  'review-session': []
}>()
</script>

<template>
  <section class="mb-9 pt-4 border-t border-border">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div class="min-w-0">
        <h2 class="text-lg font-semibold text-foreground">Encerrar Sessão</h2>
        <p class="text-sm text-muted-foreground mt-0.5">
          Finaliza a sessão, salva os resultados, atualiza ELO e estatísticas dos jogadores.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <BaseButton
          variant="secondary"
          size="md"
          :disabled="loading"
          @click="$emit('review-session')"
        >
          Revisar Resultados
        </BaseButton>
        <BaseButton variant="danger" size="md" :loading="loading" @click="$emit('end-session')">
          Encerrar Sessão
        </BaseButton>
      </div>
    </div>
  </section>
</template>

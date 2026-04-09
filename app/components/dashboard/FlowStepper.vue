<script setup lang="ts">
const route = useRoute()

const steps = [
  { label: 'Jogadores', to: '/jogadores' },
  { label: 'Confirmação', to: '/confirmacao' },
  { label: 'Sorteio', to: '/sorteio' },
  { label: 'Partida', to: '/partida' },
  { label: 'Estatísticas', to: '/estatisticas' },
  { label: 'Campeões', to: '/campeoes' },
]

function isActive(to: string) {
  return route.path === to
}
</script>

<template>
  <div class="flex items-center py-4 overflow-x-auto">
    <template v-for="(step, index) in steps" :key="step.to">
      <NuxtLink
        :to="step.to"
        class="flex flex-col items-center gap-1.5 no-underline text-muted-foreground shrink-0"
        :class="{ '!text-primary': isActive(step.to) }"
      >
        <div
          :class="[
            'w-8 h-8 rounded-full border-2 border-border flex items-center justify-center text-[13px] font-semibold bg-white text-muted-foreground transition-all',
            isActive(step.to) ? '!bg-primary !text-primary-foreground !border-primary' : '',
          ]"
        >
          {{ index + 1 }}
        </div>
        <span :class="['text-[11px] whitespace-nowrap', isActive(step.to) ? 'font-semibold' : '']">
          {{ step.label }}
        </span>
      </NuxtLink>
      <div v-if="index < steps.length - 1" class="flex-1 h-0.5 bg-border min-w-6 mb-[18px]" />
    </template>
  </div>
</template>

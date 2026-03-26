<template>
  <div>
    <div
      v-if="open"
      class="hidden max-md:block fixed inset-0 bg-black/40 z-40"
      @click="emit('close')"
    />
    <nav
      :class="[
        'fixed top-0 left-0 w-60 h-screen bg-slate-800 text-slate-300 py-4 z-50 overflow-y-auto transition-transform duration-250 ease-in-out',
        'md:translate-x-0',
        open ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
      ]"
    >
      <div class="px-6 py-5 border-b border-white/10 mb-2">
        <span class="text-xl font-bold text-white tracking-wide">MatchSoccer</span>
      </div>
      <ul class="list-none m-0 p-0">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            class="block py-2.5 px-6 text-slate-300 no-underline text-[15px] transition-colors duration-150 hover:bg-white/[.07] hover:text-white"
            active-class="bg-blue-500/25 !text-blue-400 font-semibold"
            exact-active-class="bg-blue-500/25 !text-blue-400 font-semibold"
            @click="onLinkClick"
          >
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup lang="ts">
defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/jogadores', label: 'Jogadores' },
  { to: '/confirmacao', label: 'Confirmação' },
  { to: '/sorteio', label: 'Sorteio' },
  { to: '/partida', label: 'Partida ao Vivo' },
  { to: '/estatisticas', label: 'Estatísticas' },
  { to: '/campeoes', label: 'Campeões' },
  { to: '/usuarios', label: 'Usuários' },
  { to: '/configuracoes', label: 'Configurações' },
]

function onLinkClick() {
  emit('close')
}
</script>

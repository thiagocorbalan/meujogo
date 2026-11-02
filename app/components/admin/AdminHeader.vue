<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const emit = defineEmits<{ 'toggle-sidebar': [] }>()

const authStore = useAuthStore()

async function handleLogout() {
  await authStore.logout()
  await navigateTo('/login')
}
</script>

<template>
  <header
    class="hidden max-md:flex fixed top-0 left-0 right-0 z-[60] items-center gap-3 px-4 h-14 bg-[#38003c] text-white"
  >
    <button
      class="bg-transparent border-none text-white text-[22px] cursor-pointer p-1 px-2 rounded hover:bg-white/10 leading-none"
      aria-label="Abrir menu de navegação"
      @click="emit('toggle-sidebar')"
    >
      &#9776;
    </button>
    <span class="text-lg font-bold tracking-wide flex-1 truncate">
      Admin
    </span>
    <span v-if="authStore.user" class="text-sm text-purple-200 truncate max-w-[140px]">
      {{ authStore.user.name }}
    </span>
    <button
      class="bg-transparent border-none text-purple-200 cursor-pointer p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
      aria-label="Sair"
      @click="handleLogout"
    >
      <LogOut class="w-5 h-5" />
    </button>
  </header>
</template>

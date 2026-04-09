<script setup lang="ts">
import { LogOut } from 'lucide-vue-next'

const emit = defineEmits<{ 'toggle-sidebar': [] }>()

const authStore = useAuthStore()
const groupsStore = useGroupsStore()

const activeGroupName = computed(() => {
  const ag = groupsStore.activeGroup
  return ag?.group?.name ?? ag?.name ?? ''
})
const hasMultipleGroups = computed(() => groupsStore.groups.length >= 2)

function onSwitchGroup(groupId: string) {
  if (groupId === groupsStore.activeGroupId) return
  groupsStore.switchGroup(groupId)
  reloadNuxtApp()
}

async function handleLogout() {
  await authStore.logout()
  await navigateTo('/login')
}
</script>

<template>
  <header class="hidden max-md:flex fixed top-0 left-0 right-0 z-[60] items-center gap-3 px-4 h-14 bg-slate-800 text-white">
    <button class="bg-transparent border-none text-white text-[22px] cursor-pointer p-1 px-2 rounded hover:bg-white/10 leading-none" aria-label="Toggle sidebar" @click="emit('toggle-sidebar')">
      &#9776;
    </button>
    <span class="text-lg font-bold tracking-wide flex-1 truncate">
      Meu Jogo<template v-if="activeGroupName"><span class="text-slate-400 font-normal"> | </span><span class="text-sm font-medium text-slate-300">{{ activeGroupName }}</span></template>
    </span>
    <!-- Group switcher (mobile) -->
    <select
      v-if="hasMultipleGroups"
      :value="groupsStore.activeGroupId ?? ''"
      class="bg-slate-700 text-slate-200 text-xs border border-slate-600 rounded px-2 py-1 max-w-[120px] truncate focus:outline-none focus:ring-1 focus:ring-blue-400"
      @change="onSwitchGroup(($event.target as HTMLSelectElement).value)"
    >
      <option v-for="g in groupsStore.groups" :key="g.id" :value="g.id">
        {{ g.group?.name ?? g.name }}
      </option>
    </select>
    <span v-if="authStore.user && !hasMultipleGroups" class="text-sm text-slate-300 truncate max-w-[120px]">{{ authStore.user.name }}</span>
    <button
      class="bg-transparent border-none text-slate-300 cursor-pointer p-1.5 rounded hover:bg-white/10 hover:text-white transition-colors"
      aria-label="Sair"
      @click="handleLogout"
    >
      <LogOut class="w-5 h-5" />
    </button>
  </header>
</template>

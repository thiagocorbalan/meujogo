<script setup lang="ts">
import { LogOut, ArrowLeftRight } from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const { canManageMatch, canEdit } = usePermissions()

const activeGroup = computed(() => groupsStore.activeGroup)
const activeGroupName = computed(() => activeGroup.value?.group?.name ?? activeGroup.value?.name ?? '')
const hasMultipleGroups = computed(() => groupsStore.groups.length >= 2)

type NavLink = {
  to: string
  label: string
  permission: 'view' | 'manage-match' | 'admin'
}

const links: NavLink[] = [
  { to: '/', label: 'Dashboard', permission: 'view' },
  { to: '/jogadores', label: 'Jogadores', permission: 'view' },
  { to: '/estatisticas', label: 'Estatísticas', permission: 'view' },
  { to: '/campeoes', label: 'Campeões', permission: 'view' },
  { to: '/confirmacao', label: 'Confirmação', permission: 'view' },
  { to: '/sorteio', label: 'Sorteio', permission: 'manage-match' },
  { to: '/partida', label: 'Partida ao Vivo', permission: 'manage-match' },
  { to: '/usuarios', label: 'Usuários', permission: 'admin' },
]

const groupLinks = computed(() => {
  if (!activeGroup.value) return []
  const items = [
    { to: '/perfil', label: 'Meu Perfil' },
    { to: '/info', label: 'Info do Grupo' },
  ]
  if (canEdit('settings')) {
    items.push({ to: '/membros', label: 'Membros' })
    items.push({ to: '/configuracoes', label: 'Configurações' })
  }
  return items
})

const visibleLinks = computed(() =>
  links.filter((link) => {
    if (link.permission === 'view') return true
    if (link.permission === 'manage-match') return canManageMatch()
    if (link.permission === 'admin') return authStore.isAdmin
    return false
  }),
)

function onLinkClick() {
  emit('close')
}

async function handleLogout() {
  await authStore.logout()
  emit('close')
  await navigateTo('/login')
}
</script>

<template>
  <div>
    <div
      v-if="open"
      class="hidden max-md:block fixed inset-0 bg-black/40 z-40"
      @click="emit('close')"
    />
    <nav
      :class="[
        'fixed top-0 left-0 w-60 h-screen bg-slate-800 text-slate-300 py-4 z-50 overflow-y-auto transition-transform duration-250 ease-in-out flex flex-col',
        'md:translate-x-0',
        open ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
      ]"
    >
      <div class="px-6 py-5 border-b border-white/10 mb-2">
        <span class="text-xl font-bold text-white tracking-wide">Meu Jogo</span>
        <p v-if="activeGroup" class="text-xs text-slate-400 mt-1 truncate" :title="activeGroupName">
          {{ activeGroupName }}
        </p>
        <p v-if="authStore.user" class="text-xs text-slate-500 mt-0.5 truncate">{{ authStore.user.name }}</p>
      </div>

      <!-- Main navigation -->
      <ul class="list-none m-0 p-0 flex-1">
        <li v-for="link in visibleLinks" :key="link.to">
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

        <!-- Grupo section -->
        <li v-if="activeGroup" class="mt-3 mb-1 px-6">
          <span class="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Grupo</span>
        </li>
        <li v-for="link in groupLinks" :key="link.to">
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

      <div class="px-4 py-4 border-t border-white/10 flex flex-col gap-1">
        <NuxtLink
          v-if="hasMultipleGroups"
          to="/grupos"
          class="flex items-center gap-2 w-full py-2 px-3 text-sm text-slate-300 rounded-md hover:bg-white/[.07] hover:text-white transition-colors no-underline"
          @click="onLinkClick"
        >
          <ArrowLeftRight class="w-4 h-4" />
          Trocar grupo
        </NuxtLink>
        <button
          class="flex items-center gap-2 w-full py-2 px-3 text-sm text-slate-300 rounded-md hover:bg-white/[.07] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" />
          Sair
        </button>
      </div>
    </nav>
  </div>
</template>

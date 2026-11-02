<script setup lang="ts">
import { LogOut, ArrowLeft, LayoutDashboard, Users, FolderOpen, CreditCard, Receipt, FileText, ShieldCheck, Plug } from 'lucide-vue-next'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

const authStore = useAuthStore()
const route = useRoute()

type NavLink = {
  to: string
  label: string
  icon: Component
}

const links: NavLink[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Usuários', icon: Users },
  { to: '/admin/groups', label: 'Grupos', icon: FolderOpen },
  { to: '/admin/plans', label: 'Planos', icon: CreditCard },
  { to: '/admin/billing', label: 'Billing', icon: Receipt },
  { to: '/admin/legal/terms', label: 'Termos de Uso', icon: FileText },
  { to: '/admin/legal/privacy', label: 'Privacidade', icon: ShieldCheck },
  { to: '/admin/integrations', label: 'Integrações', icon: Plug },
]

function isActive(to: string): boolean {
  if (to === '/admin') {
    return route.path === '/admin'
  }
  return route.path.startsWith(to)
}

function onLinkClick() {
  emit('close')
}

async function handleLogout() {
  await authStore.logout()
  emit('close')
  await navigateTo('/login')
}

// Close on Escape key
onMounted(() => {
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') emit('close')
  }
  window.addEventListener('keydown', onKeydown)
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
})
</script>

<template>
  <div>
    <!-- Mobile backdrop -->
    <div
      v-if="open"
      class="hidden max-md:block fixed inset-0 bg-black/40 z-40"
      aria-hidden="true"
      @click="emit('close')"
    />

    <nav
      role="navigation"
      aria-label="Menu do admin"
      :class="[
        'fixed top-0 left-0 w-60 h-screen bg-[#38003c] text-purple-100 py-4 z-50 overflow-y-auto transition-transform duration-250 ease-in-out flex flex-col',
        'md:translate-x-0',
        open ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
      ]"
    >
      <!-- Header -->
      <div class="px-6 py-5 border-b border-white/10 mb-2">
        <span class="text-xl font-bold text-white tracking-wide">Meu Jogo</span>
        <p class="text-xs text-purple-300 mt-1">Painel Admin</p>
      </div>

      <!-- Navigation links -->
      <ul class="list-none m-0 p-0 flex-1">
        <li v-for="link in links" :key="link.to">
          <NuxtLink
            :to="link.to"
            :aria-current="isActive(link.to) ? 'page' : undefined"
            :class="[
              'flex items-center gap-3 py-2.5 px-6 text-purple-100 no-underline text-[15px] transition-colors duration-150',
              isActive(link.to)
                ? 'bg-white/20 text-white font-semibold'
                : 'hover:bg-white/10 hover:text-white',
            ]"
            @click="onLinkClick"
          >
            <component :is="link.icon" class="w-4 h-4 shrink-0" aria-hidden="true" />
            {{ link.label }}
          </NuxtLink>
        </li>
      </ul>

      <!-- Footer actions -->
      <div class="px-4 py-4 border-t border-white/10 flex flex-col gap-1">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 w-full py-2 px-3 text-sm text-purple-200 rounded-md hover:bg-white/10 hover:text-white transition-colors no-underline"
          @click="onLinkClick"
        >
          <ArrowLeft class="w-4 h-4" aria-hidden="true" />
          Voltar ao App
        </NuxtLink>
        <button
          class="flex items-center gap-2 w-full py-2 px-3 text-sm text-purple-200 rounded-md hover:bg-white/10 hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          @click="handleLogout"
        >
          <LogOut class="w-4 h-4" aria-hidden="true" />
          Sair
        </button>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { Users, Calendar, MapPin, AlertCircle, UserX, Loader2 } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

definePageMeta({ layout: false })

const route = useRoute()
const authStore = useAuthStore()
const groupsStore = useGroupsStore()
const { getInviteInfo, joinGroup } = useGroups()

const loading = ref(true)
const joining = ref(false)
const errorState = ref<'not-found' | 'full' | 'generic' | null>(null)
const errorMessage = ref('')
const inviteInfo = ref<any>(null)

const code = computed(() => route.params.code as string)
const linkPlayerId = computed(() => {
  const val = route.query.linkPlayer
  return val ? Number(val) : undefined
})

onMounted(async () => {
  if (!authStore.isAuthenticated) {
    await authStore.hydrateFromStorage()
  }

  await loadInviteInfo()
})

async function loadInviteInfo() {
  loading.value = true
  errorState.value = null

  try {
    inviteInfo.value = await getInviteInfo(code.value)
  } catch (e: any) {
    const status = e?.status || e?.statusCode || e?.data?.statusCode
    if (status === 404) {
      errorState.value = 'not-found'
    } else if (status === 403) {
      errorState.value = 'full'
    } else {
      errorState.value = 'generic'
      errorMessage.value = e?.data?.message || e?.message || ''
    }
  } finally {
    loading.value = false
  }
}

async function handleJoin() {
  if (!authStore.isAuthenticated) {
    const redirectPath = linkPlayerId.value
      ? `/convite/${code.value}?linkPlayer=${linkPlayerId.value}`
      : `/convite/${code.value}`
    return navigateTo(`/login?redirect=${encodeURIComponent(redirectPath)}`)
  }

  joining.value = true
  try {
    const result = await joinGroup(code.value, linkPlayerId.value) as any
    const groupId = result?.groupId || result?.group?.id || result?.id
    if (groupId) {
      await groupsStore.fetchGroups()
      groupsStore.switchGroup(groupId)
    }
    await navigateTo('/')
  } catch (e: any) {
    const status = e?.status || e?.statusCode || e?.data?.statusCode
    if (status === 409) {
      // Already a member, redirect home
      await navigateTo('/')
    } else if (status === 403) {
      errorState.value = 'full'
      inviteInfo.value = null
    } else {
      errorState.value = 'generic'
      errorMessage.value = e?.data?.message || e?.message || 'Erro ao entrar no grupo.'
      inviteInfo.value = null
    }
  } finally {
    joining.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col items-center gap-4">
      <Loader2 class="h-8 w-8 animate-spin text-[#38003c]" />
      <p class="text-sm text-muted-foreground">Carregando convite...</p>
    </div>

    <!-- Error: invalid code / not found -->
    <Card v-else-if="errorState === 'not-found'" class="w-full max-w-md text-center">
      <CardHeader class="items-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle class="h-7 w-7 text-destructive" />
        </div>
        <CardTitle class="text-xl">Convite inválido</CardTitle>
        <CardDescription>
          Convite inválido ou grupo não encontrado. Verifique o link e tente novamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BaseButton variant="primary" class="w-full" @click="navigateTo('/login')">
          Ir para o login
        </BaseButton>
      </CardContent>
    </Card>

    <!-- Error: group full -->
    <Card v-else-if="errorState === 'full'" class="w-full max-w-md text-center">
      <CardHeader class="items-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
          <UserX class="h-7 w-7 text-orange-600" />
        </div>
        <CardTitle class="text-xl">Grupo lotado</CardTitle>
        <CardDescription>
          Este grupo atingiu o limite de membros. Entre em contato com o administrador do grupo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BaseButton variant="primary" class="w-full" @click="navigateTo('/login')">
          Ir para o login
        </BaseButton>
      </CardContent>
    </Card>

    <!-- Error: generic -->
    <Card v-else-if="errorState === 'generic'" class="w-full max-w-md text-center">
      <CardHeader class="items-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle class="h-7 w-7 text-destructive" />
        </div>
        <CardTitle class="text-xl">Erro</CardTitle>
        <CardDescription>
          {{ errorMessage || 'Ocorreu um erro ao carregar o convite. Tente novamente mais tarde.' }}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BaseButton variant="primary" class="w-full" @click="navigateTo('/login')">
          Ir para o login
        </BaseButton>
      </CardContent>
    </Card>

    <!-- Invite info loaded -->
    <Card v-else-if="inviteInfo" class="w-full max-w-md">
      <CardHeader class="items-center text-center">
        <div class="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#38003c]/10">
          <Users class="h-7 w-7 text-[#38003c]" />
        </div>
        <p class="text-sm font-medium uppercase tracking-wider text-[#38003c]">Você foi convidado</p>
        <CardTitle class="text-2xl">{{ inviteInfo.name }}</CardTitle>
        <CardDescription v-if="inviteInfo.description" class="mt-1">
          {{ inviteInfo.description }}
        </CardDescription>
      </CardHeader>

      <CardContent class="flex flex-col gap-4">
        <!-- Group details -->
        <div class="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
          <div class="flex items-center gap-3 text-sm">
            <Users class="h-4 w-4 shrink-0 text-[#38003c]" />
            <span class="text-muted-foreground">
              {{ inviteInfo.memberCount }} {{ inviteInfo.memberCount === 1 ? 'membro' : 'membros' }}
            </span>
          </div>
          <div v-if="inviteInfo.dayTime" class="flex items-center gap-3 text-sm">
            <Calendar class="h-4 w-4 shrink-0 text-[#38003c]" />
            <span class="text-muted-foreground">{{ inviteInfo.dayTime }}</span>
          </div>
          <div v-if="inviteInfo.address" class="flex items-center gap-3 text-sm">
            <MapPin class="h-4 w-4 shrink-0 text-[#38003c]" />
            <span class="text-muted-foreground">{{ inviteInfo.address }}</span>
          </div>
        </div>

        <!-- Join button -->
        <BaseButton
          variant="primary"
          :loading="joining"
          :disabled="joining"
          class="w-full"
          @click="handleJoin"
        >
          Entrar no grupo
        </BaseButton>
      </CardContent>
    </Card>
  </div>
</template>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardContent class="flex flex-col items-center gap-4 py-12">
        <!-- Loading state -->
        <template v-if="!errorMessage">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">Autenticando...</p>
        </template>

        <!-- Error state -->
        <template v-else>
          <div
            class="w-full rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm text-center"
            role="alert"
          >
            {{ errorMessage }}
          </div>
          <NuxtLink to="/login">
            <BaseButton variant="secondary">Voltar ao login</BaseButton>
          </NuxtLink>
        </template>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'

definePageMeta({ layout: false })

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const errorMessage = ref('')

onMounted(async () => {
  const { accessToken, refreshToken, error } = route.query

  if (error) {
    errorMessage.value =
      (error as string) || 'Erro durante a autenticacao. Tente novamente.'
    return
  }

  if (!accessToken || !refreshToken) {
    errorMessage.value = 'Tokens de autenticacao nao encontrados. Tente novamente.'
    return
  }

  try {
    authStore.setTokens(accessToken as string, refreshToken as string)

    // Fetch user profile with new tokens
    try {
      const { getMe } = useAuth()
      const user = await getMe() as any
      if (user) {
        authStore.setUser(user)
      }
    } catch {
      // User fetch failed but tokens are stored, continue
    }

    // Save to localStorage
    try {
      localStorage.setItem('accessToken', accessToken as string)
      localStorage.setItem('refreshToken', refreshToken as string)
      if (authStore.user) {
        localStorage.setItem('user', JSON.stringify(authStore.user))
      }
    } catch {
      // localStorage may not be available
    }

    await router.push('/')
  } catch (e: any) {
    errorMessage.value =
      e?.message || 'Erro ao processar autenticacao. Tente novamente.'
  }
})
</script>

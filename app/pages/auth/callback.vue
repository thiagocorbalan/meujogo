<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardContent class="flex flex-col items-center gap-4 py-12">
<template v-if="!errorMessage">
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">Autenticando...</p>
        </template>
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
  if (route.query.error) {
    errorMessage.value =
      (route.query.error as string) || 'Erro durante a autenticação. Tente novamente.'
    return
  }

  if (Object.keys(route.query).length > 0) {
    router.replace({ path: route.path, query: {} })
  }

  try {
    const { getMe } = useAuth()
    const user = await getMe() as any

    if (user) {
      authStore.setUser(user)
      await router.push('/')
    } else {
      errorMessage.value = 'Não foi possível autenticar. Tente novamente.'
    }
  } catch {
    errorMessage.value = 'Erro ao processar autenticação. Tente novamente.'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardHeader class="items-center text-center">
        <div class="mb-2 flex items-center gap-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            MS
          </div>
          <span class="text-2xl font-bold text-foreground">MatchSoccer</span>
        </div>
        <CardDescription>Entre com sua conta para continuar</CardDescription>
      </CardHeader>

      <CardContent class="flex flex-col gap-4">
        <!-- Error message -->
        <div
          v-if="errorMessage"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm"
          role="alert"
        >
          {{ errorMessage }}
        </div>

        <!-- Success message (from redirect) -->
        <div
          v-if="successMessage"
          class="rounded-lg border border-green-500 bg-green-500/10 p-3 text-green-600 text-sm"
          role="status"
        >
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
          <!-- Email -->
          <div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
              aria-label="Endere&ccedil;o de email"
              required
            />
            <p v-if="errors.email" class="text-xs text-destructive">{{ errors.email }}</p>
          </div>

          <!-- Password -->
          <div class="flex flex-col gap-1.5">
            <Label for="password">Senha</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Sua senha"
                autocomplete="current-password"
                aria-label="Senha"
                class="pr-10"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showPassword = !showPassword"
              >
                <EyeOff v-if="showPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <p v-if="errors.password" class="text-xs text-destructive">{{ errors.password }}</p>
          </div>

          <!-- Remember me + forgot password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.rememberMe"
                type="checkbox"
                class="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                aria-label="Lembrar de mim"
              />
              <span class="text-sm text-muted-foreground">Lembrar de mim</span>
            </label>
            <NuxtLink
              to="/esqueceu-senha"
              class="text-sm text-primary hover:underline"
            >
              Esqueceu a senha?
            </NuxtLink>
          </div>

          <!-- Submit -->
          <BaseButton
            type="submit"
            :loading="isLoading"
            :disabled="isLoading"
            class="w-full"
          >
            Entrar
          </BaseButton>
        </form>

        <!-- Divider -->
        <div class="relative flex items-center">
          <div class="flex-grow border-t border-border" />
          <span class="mx-3 text-sm text-muted-foreground">ou</span>
          <div class="flex-grow border-t border-border" />
        </div>

        <!-- Social login buttons -->
        <div class="flex flex-col gap-3">
          <!-- Google -->
          <button
            type="button"
            class="flex w-full items-center justify-center gap-3 rounded-md border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Entrar com Google"
            @click="loginWithGoogle"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Entrar com Google
          </button>

          <!-- Apple -->
          <button
            type="button"
            class="flex w-full items-center justify-center gap-3 rounded-md bg-black px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Entrar com Apple"
            @click="loginWithApple"
          >
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Entrar com Apple
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: false })

const router = useRouter()
const route = useRoute()
const config = useRuntimeConfig()
const authStore = useAuthStore()
const { login } = useAuth()

const form = ref({
  email: '',
  password: '',
  rememberMe: false,
})

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const errors = ref<{ email?: string; password?: string }>({})

// Check for success message from redirect (e.g. after password reset)
onMounted(() => {
  if (route.query.success) {
    successMessage.value = route.query.success as string
  }
})

function validate(): boolean {
  errors.value = {}

  if (!form.value.email) {
    errors.value.email = 'O email e obrigatorio.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)) {
    errors.value.email = 'Formato de email invalido.'
  }

  if (!form.value.password) {
    errors.value.password = 'A senha e obrigatoria.'
  }

  return Object.keys(errors.value).length === 0
}

async function handleLogin() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!validate()) return

  isLoading.value = true
  try {
    const result = await login({
      email: form.value.email,
      password: form.value.password,
      rememberMe: form.value.rememberMe,
    }) as any

    authStore.login({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    })

    await router.push('/')
  } catch (e: any) {
    errorMessage.value =
      e?.data?.message || e?.message || 'Erro ao fazer login. Verifique suas credenciais.'
  } finally {
    isLoading.value = false
  }
}

function loginWithGoogle() {
  window.location.href = `${config.public.apiBaseUrl}/auth/google`
}

function loginWithApple() {
  window.location.href = `${config.public.apiBaseUrl}/auth/apple`
}
</script>

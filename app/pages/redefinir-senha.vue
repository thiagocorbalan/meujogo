<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: false })

const router = useRouter()
const route = useRoute()
const { resetPassword } = useAuth()

const token = computed(() => (route.query.token as string) || '')

const form = ref({
  password: '',
  confirmPassword: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const tokenError = ref('')

const errors = ref<{ password?: string; confirmPassword?: string }>({})

onMounted(() => {
  if (!token.value) {
    tokenError.value = 'Token de redefinição ausente ou inválido. Solicite um novo link de recuperação.'
  }
})

function validate(): boolean {
  errors.value = {}

  if (!form.value.password) {
    errors.value.password = 'A senha é obrigatória.'
  } else if (form.value.password.length < 8) {
    errors.value.password = 'A senha deve ter no mínimo 8 caracteres.'
  }

  if (!form.value.confirmPassword) {
    errors.value.confirmPassword = 'Confirme sua nova senha.'
  } else if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'As senhas não coincidem.'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!validate()) return

  isLoading.value = true
  try {
    await resetPassword({
      token: token.value,
      password: form.value.password,
    })

    await router.push({
      path: '/login',
      query: { success: 'Senha redefinida com sucesso! Faça login com sua nova senha.' },
    })
  } catch (e: any) {
    const message = e?.data?.message || e?.message || ''
    if (message.toLowerCase().includes('token') || message.toLowerCase().includes('expirad')) {
      tokenError.value = 'O link de redefinição expirou ou é inválido. Solicite um novo link.'
    } else {
      errorMessage.value = message || 'Erro ao redefinir senha. Tente novamente.'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
    <Card class="w-full max-w-md">
      <CardHeader class="items-center text-center">
        <div class="mb-2 flex items-center gap-2">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            MS
          </div>
          <span class="text-2xl font-bold text-foreground">Meu Jogo</span>
        </div>
        <CardTitle class="text-xl">Redefinir senha</CardTitle>
        <CardDescription>
          Escolha uma nova senha para sua conta
        </CardDescription>
      </CardHeader>

      <CardContent class="flex flex-col gap-4">
<div
          v-if="tokenError"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm"
          role="alert"
        >
          {{ tokenError }}
          <div class="mt-2">
            <NuxtLink to="/esqueceu-senha" class="text-sm font-medium underline">
              Solicitar novo link
            </NuxtLink>
          </div>
        </div>
<div
          v-if="errorMessage"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm"
          role="alert"
        >
          {{ errorMessage }}
        </div>

        <form v-if="!tokenError" class="flex flex-col gap-4" @submit.prevent="handleSubmit">
<div class="flex flex-col gap-1.5">
            <Label for="password">Nova senha</Label>
            <div class="relative">
              <Input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Mínimo 8 caracteres"
                autocomplete="new-password"
                aria-label="Nova senha"
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
<div class="flex flex-col gap-1.5">
            <Label for="confirmPassword">Confirmar senha</Label>
            <div class="relative">
              <Input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Repita a nova senha"
                autocomplete="new-password"
                aria-label="Confirmar nova senha"
                class="pr-10"
                required
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                :aria-label="showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
            <p v-if="errors.confirmPassword" class="text-xs text-destructive">{{ errors.confirmPassword }}</p>
          </div>
<BaseButton
            type="submit"
            :loading="isLoading"
            :disabled="isLoading"
            class="w-full"
          >
            Redefinir senha
          </BaseButton>
        </form>
<div class="text-center">
          <NuxtLink
            to="/login"
            class="text-sm text-primary hover:underline"
          >
            Voltar ao login
          </NuxtLink>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

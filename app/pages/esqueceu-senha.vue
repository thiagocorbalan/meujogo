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
        <CardTitle class="text-xl">Recuperar senha</CardTitle>
        <CardDescription>
          Informe seu email e enviaremos um link para redefinir sua senha
        </CardDescription>
      </CardHeader>

      <CardContent class="flex flex-col gap-4">
<div
          v-if="errorMessage"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm"
          role="alert"
        >
          {{ errorMessage }}
        </div>
<div
          v-if="sent"
          class="rounded-lg border border-green-500 bg-green-500/10 p-3 text-green-600 text-sm"
          role="status"
        >
          Se o email existir em nossa base, enviaremos um link de recuperacao.
        </div>

        <form v-if="!sent" @submit.prevent="handleSubmit" class="flex flex-col gap-4">
<div class="flex flex-col gap-1.5">
            <Label for="email">Email</Label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
              aria-label="Endere&ccedil;o de email"
              required
            />
            <p v-if="emailError" class="text-xs text-destructive">{{ emailError }}</p>
          </div>
<BaseButton
            type="submit"
            :loading="isLoading"
            :disabled="isLoading"
            class="w-full"
          >
            Enviar link de recuperacao
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

<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

definePageMeta({ layout: false })

const { forgotPassword } = useAuth()

const email = ref('')
const isLoading = ref(false)
const sent = ref(false)
const errorMessage = ref('')
const emailError = ref('')

function validate(): boolean {
  emailError.value = ''

  if (!email.value) {
    emailError.value = 'O email e obrigatorio.'
    return false
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Formato de email invalido.'
    return false
  }

  return true
}

async function handleSubmit() {
  errorMessage.value = ''

  if (!validate()) return

  isLoading.value = true
  try {
    await forgotPassword(email.value)
    sent.value = true
  } catch (e: any) {
    sent.value = true
  } finally {
    isLoading.value = false
  }
}
</script>

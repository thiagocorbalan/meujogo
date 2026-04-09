<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="mb-8 text-center">
        <div class="mb-4 flex items-center justify-center gap-2">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-[#38003c] text-white font-bold text-xl">
            MJ
          </div>
        </div>
        <h1 class="text-3xl font-bold text-foreground">Bem-vindo ao Meu Jogo!</h1>
        <p class="mt-2 text-base text-muted-foreground">
          Organize suas peladas com times equilibrados e muito mais.
        </p>
      </div>

      <!-- Option cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <!-- Create group card -->
        <Card
          class="cursor-pointer transition-all hover:border-[#38003c]/40 hover:shadow-md"
          @click="navigateTo('/grupos/criar')"
        >
          <CardHeader class="items-center text-center">
            <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#38003c]/10">
              <PlusCircle class="h-6 w-6 text-[#38003c]" />
            </div>
            <CardTitle class="text-lg">Criar meu primeiro grupo</CardTitle>
            <CardDescription>
              Crie um grupo para organizar suas peladas e convide seus amigos.
            </CardDescription>
          </CardHeader>
          <CardContent class="pt-0">
            <div class="flex items-center justify-center text-sm font-medium text-[#38003c]">
              Começar agora
              <ArrowRight class="ml-1 h-4 w-4" />
            </div>
          </CardContent>
        </Card>

        <!-- Join with invite card -->
        <Card class="flex flex-col">
          <CardHeader class="items-center text-center">
            <div class="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#38003c]/10">
              <Link2 class="h-6 w-6 text-[#38003c]" />
            </div>
            <CardTitle class="text-lg">Tenho um convite</CardTitle>
            <CardDescription>
              Cole o link ou código de convite que você recebeu.
            </CardDescription>
          </CardHeader>
          <CardContent class="flex flex-1 flex-col justify-end pt-0">
            <form class="flex flex-col gap-3" @submit.prevent="handleInvite">
              <Input
                v-model="inviteInput"
                placeholder="Link ou código do convite"
                aria-label="Link ou código de convite"
              />
              <div
                v-if="inviteError"
                class="text-xs text-destructive"
                role="alert"
              >
                {{ inviteError }}
              </div>
              <BaseButton
                type="submit"
                variant="primary"
                :disabled="!inviteInput.trim()"
                class="w-full"
              >
                Entrar no grupo
              </BaseButton>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PlusCircle, Link2, ArrowRight } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

definePageMeta({ layout: false })

const inviteInput = ref('')
const inviteError = ref('')

function parseInviteCode(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Try to parse as full URL: meujogo.app/convite/XXXXX or localhost:4000/convite/XXXXX
  try {
    const url = new URL(trimmed)
    const match = url.pathname.match(/\/convite\/([^/]+)/)
    if (match) return match[1]
  } catch {
    // Not a valid URL, continue
  }

  // Try to match partial URL pattern (without protocol)
  const pathMatch = trimmed.match(/\/convite\/([^/\s]+)/)
  if (pathMatch) return pathMatch[1]

  // If no slashes, treat the whole thing as a raw code
  if (!trimmed.includes('/')) return trimmed

  // Last resort: try to get last path segment
  const segments = trimmed.split('/').filter(Boolean)
  if (segments.length > 0) return segments[segments.length - 1]

  return null
}

function handleInvite() {
  inviteError.value = ''
  const code = parseInviteCode(inviteInput.value)

  if (!code) {
    inviteError.value = 'Informe um código ou link de convite válido.'
    return
  }

  navigateTo('/convite/' + code)
}
</script>

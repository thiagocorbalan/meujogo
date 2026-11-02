<script setup lang="ts">
definePageMeta({ layout: false })

const api = useApi()

interface LegalDocument {
  id: number
  type: string
  version: string
  content: string
  publishedAt: string
}

const { data: policy, status, error } = await useAsyncData<LegalDocument>(
  'legal-privacy',
  () => api.fetch('/legal/privacy'),
  { default: () => null as unknown as LegalDocument },
)

const isLoading = computed(() => status.value === 'pending')

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-muted/40">
    <header class="border-b border-border bg-background px-4 py-4">
      <div class="mx-auto flex max-w-3xl items-center gap-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
            MS
          </div>
          <span class="text-xl font-bold text-foreground">Meu Jogo</span>
        </NuxtLink>
      </div>
    </header>

    <main class="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-20 text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        Carregando...
      </div>

      <div
        v-else-if="error"
        class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive"
        role="alert"
      >
        Erro ao carregar a Política de Privacidade. Tente novamente mais tarde.
      </div>

      <template v-else-if="policy">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-foreground">Política de Privacidade</h1>
          <p class="mt-2 text-sm text-muted-foreground">
            Versão {{ policy.version }} &middot; Publicado em {{ formatDate(policy.publishedAt) }}
          </p>
        </div>

        <article
          class="rounded-lg border border-border bg-background p-6 leading-relaxed text-foreground
            [&_h1]:mb-4 [&_h1]:text-2xl [&_h1]:font-bold
            [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold
            [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-lg [&_h3]:font-semibold
            [&_p]:mb-4 [&_p]:text-muted-foreground
            [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6
            [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6
            [&_li]:mb-1 [&_li]:text-muted-foreground
            [&_a]:text-primary [&_a]:underline
            [&_strong]:font-semibold [&_strong]:text-foreground"
          v-html="policy.content"
        />
      </template>

      <div
        v-else
        class="rounded-lg border border-border bg-background p-8 text-center text-muted-foreground"
      >
        A Política de Privacidade ainda não foi publicada. Por favor, volte em breve.
      </div>
    </main>

    <footer class="border-t border-border bg-background px-4 py-6 text-center text-sm text-muted-foreground">
      <p>
        <NuxtLink to="/termos" class="hover:text-foreground hover:underline">Termos de Uso</NuxtLink>
        &nbsp;&middot;&nbsp;
        <NuxtLink to="/privacidade" class="hover:text-foreground hover:underline">Política de Privacidade</NuxtLink>
      </p>
      <p class="mt-1">&copy; {{ new Date().getFullYear() }} Meu Jogo</p>
    </footer>
  </div>
</template>

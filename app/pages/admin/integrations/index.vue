<script setup lang="ts">
definePageMeta({ layout: 'admin' })

const { getIntegrations } = useAdminApi()

// Service metadata — display name + icon
const SERVICE_META: Record<string, { name: string; icon: string }> = {
  STRIPE: { name: 'Stripe', icon: '💳' },
  SENDGRID: { name: 'SendGrid', icon: '📧' },
  RESEND: { name: 'Resend', icon: '✉️' },
  SENTRY: { name: 'Sentry', icon: '🛡️' },
  GOOGLE_OAUTH: { name: 'Google OAuth', icon: '🔑' },
  APPLE_OAUTH: { name: 'Apple OAuth', icon: '🍎' },
}

const SERVICES = Object.keys(SERVICE_META)

interface IntegrationItem {
  service: string
  isConfigured: boolean
  maskedKey: string | null
}

const loading = ref(true)
const error = ref<string | null>(null)
const integrations = ref<IntegrationItem[]>([])

async function loadIntegrations() {
  loading.value = true
  error.value = null
  try {
    const data = await getIntegrations() as any
    // API returns array or object; normalise to per-service map
    const map: Record<string, { isConfigured: boolean; maskedKey: string | null }> = {}

    if (Array.isArray(data)) {
      for (const item of data) {
        map[item.service] = {
          isConfigured: item.isConfigured ?? !!item.maskedKey,
          maskedKey: item.maskedKey ?? null,
        }
      }
    } else if (data && typeof data === 'object') {
      for (const [key, val] of Object.entries(data)) {
        const v = val as any
        map[key] = {
          isConfigured: v?.isConfigured ?? !!v?.maskedKey,
          maskedKey: v?.maskedKey ?? null,
        }
      }
    }

    integrations.value = SERVICES.map((svc) => ({
      service: svc,
      isConfigured: map[svc]?.isConfigured ?? false,
      maskedKey: map[svc]?.maskedKey ?? null,
    }))
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Erro ao carregar integracoes. Tente novamente.'
    // Fallback: render cards in unconfigured state so user can still save keys
    integrations.value = SERVICES.map((svc) => ({
      service: svc,
      isConfigured: false,
      maskedKey: null,
    }))
  } finally {
    loading.value = false
  }
}

onMounted(loadIntegrations)

function onSaved(service: string) {
  // Reload the list so the status badge and masked key update
  loadIntegrations()
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-foreground mb-1">Integracoes</h1>
    <p class="text-sm text-muted-foreground mb-6">
      Configure as chaves de API dos servicos externos. As chaves sao armazenadas cifradas.
    </p>

    <!-- Global error (load failure) -->
    <div
      v-if="error"
      role="alert"
      class="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm mb-6"
    >
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
      <div
        v-for="i in SERVICES.length"
        :key="i"
        class="h-48 rounded-xl border bg-card animate-pulse"
        aria-hidden="true"
      />
    </div>

    <!-- Cards grid -->
    <div
      v-else
      class="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4"
      role="list"
      aria-label="Servicos de integracao"
    >
      <div
        v-for="item in integrations"
        :key="item.service"
        role="listitem"
      >
        <AdminIntegrationCard
          :service="item.service"
          :name="SERVICE_META[item.service]?.name ?? item.service"
          :icon="SERVICE_META[item.service]?.icon ?? '🔧'"
          :is-configured="item.isConfigured"
          :masked-key="item.maskedKey"
          @saved="onSaved"
        />
      </div>
    </div>
  </div>
</template>

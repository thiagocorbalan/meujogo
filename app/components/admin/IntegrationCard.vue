<script setup lang="ts">
import { CheckCircle2, AlertCircle, Eye, EyeOff, Loader2, Wifi, WifiOff } from 'lucide-vue-next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const props = defineProps<{
  service: string
  name: string
  icon: string
  isConfigured: boolean
  maskedKey: string | null
}>()

const emit = defineEmits<{
  saved: [service: string]
}>()

const { upsertIntegration, testIntegration } = useAdminApi()

// Edit form state
const showEditForm = ref(false)
const newKey = ref('')
const showKey = ref(false)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)

// Test state
const testing = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

function toggleEditForm() {
  showEditForm.value = !showEditForm.value
  if (!showEditForm.value) {
    newKey.value = ''
    showKey.value = false
    saveError.value = null
    saveSuccess.value = false
  }
}

async function onSave() {
  if (!newKey.value.trim()) return
  saving.value = true
  saveError.value = null
  saveSuccess.value = false
  try {
    await upsertIntegration(props.service, newKey.value.trim())
    saveSuccess.value = true
    newKey.value = ''
    showKey.value = false
    showEditForm.value = false
    emit('saved', props.service)
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || ''
    if (msg.includes('INTEGRATION_ENCRYPTION_KEY') || msg.includes('encryption')) {
      saveError.value = 'Chave de criptografia não configurada no servidor. Contate o administrador do sistema.'
    } else {
      saveError.value = msg || 'Erro ao salvar a chave. Tente novamente.'
    }
  } finally {
    saving.value = false
  }
}

async function onTest() {
  testing.value = true
  testResult.value = null
  try {
    const res = await testIntegration(props.service)
    testResult.value = {
      success: true,
      message: res?.message || 'Conexão bem-sucedida',
    }
  } catch (e: any) {
    const msg = e?.data?.message || e?.message || 'Falha na conexão'
    testResult.value = { success: false, message: msg }
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="pb-3">
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="text-2xl" aria-hidden="true">{{ icon }}</span>
          <CardTitle class="text-base">{{ name }}</CardTitle>
        </div>

        <!-- Status badge: always icon + color + text -->
        <span
          v-if="isConfigured"
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium text-green-700 bg-green-50 border-green-200 shrink-0"
          aria-label="Status: Configurado"
        >
          <CheckCircle2 class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Configurado
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium text-gray-500 bg-gray-50 border-gray-200 shrink-0"
          aria-label="Status: Nao configurado"
        >
          <AlertCircle class="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          Nao configurado
        </span>
      </div>
    </CardHeader>

    <CardContent class="flex flex-col gap-4 flex-1">
      <!-- Masked key display -->
      <div v-if="maskedKey" class="flex flex-col gap-1">
        <p class="text-xs text-muted-foreground font-medium">Chave atual</p>
        <code class="text-sm font-mono bg-muted px-2 py-1 rounded text-muted-foreground break-all">
          {{ maskedKey }}
        </code>
      </div>

      <!-- Edit key form -->
      <div v-if="showEditForm" class="flex flex-col gap-3">
        <div class="flex flex-col gap-1.5">
          <Label :for="`key-input-${service}`">API Key para {{ name }}</Label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <Input
                :id="`key-input-${service}`"
                v-model="newKey"
                :type="showKey ? 'text' : 'password'"
                :aria-label="`API Key para ${name}`"
                placeholder="Cole a nova chave aqui"
                class="pr-10"
                @keydown.enter="onSave"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                :aria-label="showKey ? 'Ocultar chave' : 'Mostrar chave'"
                @click="showKey = !showKey"
              >
                <EyeOff v-if="showKey" class="w-4 h-4" aria-hidden="true" />
                <Eye v-else class="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <BaseButton
              type="button"
              size="sm"
              :loading="saving"
              :disabled="!newKey.trim()"
              @click="onSave"
            >
              Salvar
            </BaseButton>
          </div>
        </div>

        <!-- Save error -->
        <div
          v-if="saveError"
          role="alert"
          class="rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive text-sm"
        >
          {{ saveError }}
        </div>
      </div>

      <!-- Test result -->
      <div
        v-if="testResult"
        role="status"
        :class="[
          'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium',
          testResult.success
            ? 'text-green-700 bg-green-50 border-green-200'
            : 'text-red-700 bg-red-50 border-red-200',
        ]"
      >
        <Wifi v-if="testResult.success" class="w-4 h-4 shrink-0" aria-hidden="true" />
        <WifiOff v-else class="w-4 h-4 shrink-0" aria-hidden="true" />
        {{ testResult.message }}
      </div>

      <!-- Action buttons -->
      <div class="flex flex-wrap gap-2 mt-auto pt-2">
        <BaseButton
          type="button"
          variant="secondary"
          size="sm"
          @click="toggleEditForm"
        >
          {{ showEditForm ? 'Cancelar' : 'Editar Chave' }}
        </BaseButton>

        <BaseButton
          type="button"
          variant="secondary"
          size="sm"
          :disabled="testing || !isConfigured"
          :aria-busy="testing ? 'true' : 'false'"
          :title="!isConfigured ? 'Configure uma chave antes de testar' : undefined"
          @click="onTest"
        >
          <Loader2 v-if="testing" class="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          Testar Conexao
        </BaseButton>
      </div>
    </CardContent>
  </Card>
</template>
